use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use ephemeral_rollups_sdk::anchor::{commit, delegate};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;
use session_keys::{Session, SessionToken, session_auth_or, SessionError};

use crate::state::*;
use crate::errors::GameError;
use crate::constants::*;

// ============================================================
// Account Contexts
// ============================================================

/// Player 1 creates the game by providing a game_id from the frontend.
/// Initializes BattleState PDA seeded by [b"battle", game_id].
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = player_one,
        space = 8 + BattleState::INIT_SPACE,
        seeds = [b"battle", game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub battle: Account<'info, BattleState>,

    #[account(seeds = [b"player", player_one.key().as_ref()], bump)]
    pub player_one_profile: Account<'info, PlayerProfile>,

    #[account(mut)]
    pub player_one: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Player 2 joins using the game_id. Game must be in Waiting status.
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct JoinGame<'info> {
    #[account(
        mut,
        seeds = [b"battle", game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub battle: Account<'info, BattleState>,

    #[account(seeds = [b"player", player_two.key().as_ref()], bump)]
    pub player_two_profile: Account<'info, PlayerProfile>,

    #[account(mut)]
    pub player_two: Signer<'info>,
}

/// Delegate the BattleState PDA to the Ephemeral Rollup.
/// Either player can call this once the game is Active.
#[delegate]
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct DelegateGame<'info> {
    pub payer: Signer<'info>,
    /// CHECK: Validated by seeds
    #[account(mut, del, seeds = [b"battle", game_id.to_le_bytes().as_ref()], bump)]
    pub pda: AccountInfo<'info>,
}

/// Deploy a troop (runs on ER). Session key support for seamless gameplay.
#[derive(Accounts, Session)]
#[instruction(game_id: u64)]
pub struct DeployTroop<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"battle", game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub battle: Account<'info, BattleState>,

    #[account(seeds = [b"player", player_profile.authority.key().as_ref()], bump)]
    pub player_profile: Account<'info, PlayerProfile>,

    #[session(signer = signer, authority = player_profile.authority)]
    pub session_token: Option<Account<'info, SessionToken>>,
}

/// End game (runs on ER). Accepts the winner index from the frontend.
#[derive(Accounts, Session)]
#[instruction(game_id: u64, winner_idx: u8)]
pub struct EndGame<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"battle", game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub battle: Account<'info, BattleState>,

    #[account(seeds = [b"player", player_profile.authority.key().as_ref()], bump)]
    pub player_profile: Account<'info, PlayerProfile>,

    #[session(signer = signer, authority = player_profile.authority)]
    pub session_token: Option<Account<'info, SessionToken>>,
}

/// Commit and undelegate the battle account back to base layer.
#[commit]
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct CommitBattle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"battle", game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub battle: Account<'info, BattleState>,
}

/// Mint trophies (runs on base layer after undelegation). Winner claims +50 trophies.
#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct MintTrophies<'info> {
    #[account(
        mut,
        seeds = [b"battle", game_id.to_le_bytes().as_ref()],
        bump
    )]
    pub battle: Account<'info, BattleState>,

    #[account(mut, seeds = [b"player", signer.key().as_ref()], bump)]
    pub profile: Account<'info, PlayerProfile>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    /// CHECK: Seeds check
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

// ============================================================
// Instructions
// ============================================================

/// Player 1 creates a game lobby with a frontend-supplied game_id.
pub fn create_game(ctx: Context<CreateGame>, game_id: u64) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    battle.game_id = game_id;
    battle.players = [ctx.accounts.player_one.key(), Pubkey::default()];
    battle.status = GameStatus::Waiting;
    battle.tick_count = 0;
    battle.elixir = [500, 500];
    battle.winner = None;
    battle.trophies_minted = false;
    battle.entities = Vec::new();
    battle.last_update_time = Clock::get()?.unix_timestamp;

    battle.towers = [
        Tower { health: 3000, x: 0,   y: -20, owner_idx: 0, is_king: true  },
        Tower { health: 1500, x: -10, y: -15, owner_idx: 0, is_king: false },
        Tower { health: 1500, x: 10,  y: -15, owner_idx: 0, is_king: false },
        Tower { health: 3000, x: 0,   y: 20,  owner_idx: 1, is_king: true  },
        Tower { health: 1500, x: -10, y: 15,  owner_idx: 1, is_king: false },
        Tower { health: 1500, x: 10,  y: 15,  owner_idx: 1, is_king: false },
    ];

    msg!("Game {} created by {}", game_id, ctx.accounts.player_one.key());
    Ok(())
}

/// Player 2 joins using the game_id. Transitions game to Active.
pub fn join_game(ctx: Context<JoinGame>, _game_id: u64) -> Result<()> {
    let battle = &mut ctx.accounts.battle;

    require!(battle.status == GameStatus::Waiting, GameError::GameNotWaiting);
    require!(battle.players[1] == Pubkey::default(), GameError::GameAlreadyFull);
    require!(
        battle.players[0] != ctx.accounts.player_two.key(),
        GameError::InvalidPlayer
    );

    battle.players[1] = ctx.accounts.player_two.key();
    battle.status = GameStatus::Active;
    battle.last_update_time = Clock::get()?.unix_timestamp;

    msg!("Player {} joined game {}", ctx.accounts.player_two.key(), battle.game_id);
    Ok(())
}

/// Delegate the BattleState PDA to the ER. Any one player can call this.
pub fn delegate_game(ctx: Context<DelegateGame>, game_id: u64) -> Result<()> {
    ctx.accounts.delegate_pda(
        &ctx.accounts.payer,
        &[b"battle", game_id.to_le_bytes().as_ref()],
        DelegateConfig {
            validator: ctx.remaining_accounts.first().map(|acc| acc.key()),
            ..Default::default()
        },
    )?;
    Ok(())
}

/// Deploy a troop on ER. Validates player is in the game, deducts elixir, spawns entity.
/// Checks for tower destruction: king tower = instant win, princess tower = tra
pub fn deploy_troop(ctx: Context<DeployTroop>, _game_id: u64, card_idx: u8, x: i32, y: i32) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let profile = &ctx.accounts.player_profile;

    require!(battle.status == GameStatus::Active, GameError::GameNotActive);

    // Elixir regeneration logic
    let now = Clock::get()?.unix_timestamp;
    let elapsed = (now - battle.last_update_time).max(0) as u64;
    if elapsed > 0 {
        for i in 0..2 {
            battle.elixir[i] = (battle.elixir[i] + elapsed * 100).min(1000);
        }
        battle.last_update_time = now;
    }

    let signer = ctx.accounts.player_profile.authority.key();
    let player_idx = if battle.players[0] == signer {
        0usize
    } else if battle.players[1] == signer {
        1usize
    } else {
        return err!(GameError::NotAPlayer);
    };

    if card_idx as usize >= 8 { return err!(GameError::InvalidCardIdx); }
    let card_id = profile.deck[card_idx as usize];
    if card_id == 0 { return err!(GameError::EmptyCardSlot); }

    let config = profile.inventory.iter()
        .find(|c| c.card_id == card_id)
        .ok_or(GameError::CardNotOwned)?;

    let base_stats = get_card_stats(card_id).ok_or(GameError::InvalidCardId)?;

    let multiplier = 100 + ((config.level as u64 - 1) * 10);
    let scaled_health = (base_stats.health as u64 * multiplier / 100) as i32;
    let scaled_damage = (base_stats.damage as u64 * multiplier / 100) as i32;
    let scaled_cost = (base_stats.cost as u64) * 100;

    if battle.elixir[player_idx] < scaled_cost {
        return err!(GameError::NotEnoughElixir);
    }
    battle.elixir[player_idx] -= scaled_cost;

    if battle.entities.len() >= MAX_ENTITIES {
        return err!(GameError::TooManyEntities);
    }

    let new_id = (battle.tick_count * 100) as u32 + battle.entities.len() as u32;

    battle.entities.push(Entity {
        id: new_id,
        owner_idx: player_idx as u8,
        card_id,
        x,
        y,
        health: scaled_health,
        damage: scaled_damage,
        state: EntityState::Moving,
        target_id: None,
    });

    battle.tick_count += 1;

    // -------------------------------------------------------
    // Tower destruction checks (winner determination)
    //
    // Tower layout (indices):
    //   0 = P0 King Tower  (is_king: true)
    //   1 = P0 Left Princess Tower
    //   2 = P0 Right Princess Tower
    //   3 = P1 King Tower  (is_king: true)
    //   4 = P1 Left Princess Tower
    //   5 = P1 Right Princess Tower
    //
    // Rule: King tower destroyed → instant win.
    //       Princess tower destroyed → increment towers_destroyed for the attacker.
    // -------------------------------------------------------
    if battle.winner.is_none() {
        // Snapshot damage dealt to each side's towers
        // Towers 0..2 belong to player 0; towers 3..5 belong to player 1
        let mut p0_towers_lost: u8 = 0;
        let mut p1_towers_lost: u8 = 0;

        for (_i, tower) in battle.towers.iter().enumerate() {
            if tower.health <= 0 {
                if tower.owner_idx == 0 {
                    // Player 0's tower was destroyed → Player 1 gets credit
                    if tower.is_king {
                        // Instant win for Player 1
                        battle.winner = Some(1);
                        battle.status = GameStatus::Completed;
                        break;
                    } else {
                        p0_towers_lost += 1;
                    }
                } else {
                    // Player 1's tower was destroyed → Player 0 gets credit
                    if tower.is_king {
                        // Instant win for Player 0
                        battle.winner = Some(0);
                        battle.status = GameStatus::Completed;
                        break;
                    } else {
                        p1_towers_lost += 1;
                    }
                }
            }
        }

        // Update towers_destroyed counters
        // Player 0 destroyed p1_towers_lost of P1's princess towers
        // Player 1 destroyed p0_towers_lost of P0's princess towers
        battle.towers_destroyed[0] = p1_towers_lost;
        battle.towers_destroyed[1] = p0_towers_lost;

        // Update cumulative damage dealt to enemy towers
        // Damage = initial HP - current HP for each tower
        let p0_towers_initial: [i32; 3] = [3000, 1500, 1500]; // P0 towers at indices 0,1,2
        let p1_towers_initial: [i32; 3] = [3000, 1500, 1500]; // P1 towers at indices 3,4,5

        let mut damage_to_p1: u64 = 0;
        for (i, &init) in p1_towers_initial.iter().enumerate() {
            let current = battle.towers[3 + i].health;
            let dmg = (init - current.max(0)) as u64;
            damage_to_p1 += dmg;
        }
        let mut damage_to_p0: u64 = 0;
        for (i, &init) in p0_towers_initial.iter().enumerate() {
            let current = battle.towers[i].health;
            let dmg = (init - current.max(0)) as u64;
            damage_to_p0 += dmg;
        }
        battle.damage_dealt[0] = damage_to_p1; // P0 dealt damage to P1's towers
        battle.damage_dealt[1] = damage_to_p0; // P1 dealt damage to P0's towers
    }

    Ok(())
}

/// End game (runs on ER).
/// winner_idx: 0 for P1, 1 for P2, 255 for Draw (None)
#[session_auth_or(
    ctx.accounts.player_profile.authority.key() == ctx.accounts.signer.key(),
    GameError::InvalidAuth
)]
pub fn end_game(ctx: Context<EndGame>, _game_id: u64, winner_idx: u8) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let signer = ctx.accounts.player_profile.authority.key();

    require!(battle.status == GameStatus::Active, GameError::GameNotActive);

    // Verify signer is one of the players
    require!(
        battle.players[0] == signer || battle.players[1] == signer,
        GameError::NotAPlayer
    );

    if winner_idx == 255 {
        battle.winner = None;
    } else {
        battle.winner = Some(winner_idx);
    }
    
    battle.status = GameStatus::Completed;
    msg!("Game ended. Winner: {:?}", battle.winner);

    Ok(())
}

/// Commit and undelegate the battle account back to base layer
pub fn commit_battle(ctx: Context<CommitBattle>, _game_id: u64) -> Result<()> {
    commit_and_undelegate_accounts(
        &ctx.accounts.payer,
        vec![&ctx.accounts.battle.to_account_info()],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;

    Ok(())
}

/// Winner calls mint_trophies on the base layer after undelegation. Mints 50 trophies.
pub fn mint_trophies(ctx: Context<MintTrophies>, _game_id: u64) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let signer_key = ctx.accounts.signer.key();

    // Check game is completed
    require!(battle.status == GameStatus::Completed, GameError::GameNotFinished);

    // Check not already minted
    require!(!battle.trophies_minted, GameError::AlreadyMinted);

    // Verify caller is the winner
    let winner_idx = battle.winner.ok_or(GameError::WinnerNotDetermined)?;
    require!(
        battle.players[winner_idx as usize] == signer_key,
        GameError::NotWinner
    );

    // Mint SPL token (trophies)
    let bump = ctx.bumps.mint_authority;
    let seeds = &[b"mint_authority".as_ref(), &[bump]];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.destination.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

    token::mint_to(cpi_ctx, TOKEN_REWARD_AMOUNT * 1_000_000)?;

    // Update profile stats
    ctx.accounts.profile.trophies += TOKEN_REWARD_AMOUNT as u32;
    ctx.accounts.profile.mmr += 30;

    battle.trophies_minted = true;

    msg!("Minted {} trophies to winner {}", TOKEN_REWARD_AMOUNT, signer_key);
    Ok(())
}
