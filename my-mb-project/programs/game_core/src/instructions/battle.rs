use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use ephemeral_rollups_sdk::anchor::{commit, delegate};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};
use session_keys::{Session, SessionToken};

use crate::state::*;
use crate::errors::GameError;
use crate::constants::*;

#[delegate]
#[derive(Accounts)]
pub struct DelegateInput<'info> {
    pub payer: Signer<'info>,
    /// CHECK: Validated by seeds
    #[account(mut, del, seeds = [b"player", payer.key().as_ref()], bump)]
    pub pda: AccountInfo<'info>, 
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(init, payer = authority, space = 8 + GameState::INIT_SPACE)]
    pub game: Account<'info, GameState>,
    
    #[account(init, payer = authority, space = 8 + BattleState::INIT_SPACE)]
    pub battle: Account<'info, BattleState>,

    /// CHECK: Validated in instruction
    pub player_one: AccountInfo<'info>,
    /// CHECK: Validated in instruction
    pub player_two: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts, Session)]
pub struct UpdateBattle<'info> {
    #[account(mut)]
    pub battle: Account<'info, BattleState>, 
    
    pub game: Account<'info, GameState>, 
    
    #[account(seeds = [b"player", signer.key().as_ref()], bump)]
    pub player_profile: Account<'info, PlayerProfile>,

    #[account(mut)]
    pub signer: Signer<'info>,
    
    #[session(signer = signer, authority = player_profile.authority)]
    pub session_token: Option<Account<'info, SessionToken>>,
}

#[derive(Accounts)]
pub struct ResolveGame<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub battle: Account<'info, BattleState>, 
    
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub player_one: AccountInfo<'info>,
    /// CHECK: Validated in instruction
    #[account(mut)]
    pub player_two: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct CommitBattle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub battle: Account<'info, BattleState>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
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

pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
    require!(ctx.accounts.authority.key().to_string() == BACKEND_AUTHORITY, GameError::Unauthorized);

    let game = &mut ctx.accounts.game;
    game.players = [ctx.accounts.player_one.key(), ctx.accounts.player_two.key()];
    game.status = GameStatus::Active;
    game.created_at = Clock::get()?.unix_timestamp;
    game.rewards_claimed = [false; 2];

    let battle = &mut ctx.accounts.battle;
    battle.tick_count = 0;
    battle.elixir = [500, 500]; 
    
    battle.towers = [
        Tower { health: 3000, x: 0, y: -20, owner_idx: 0, is_king: true },
        Tower { health: 1500, x: -10, y: -15, owner_idx: 0, is_king: false },
        Tower { health: 1500, x: 10, y: -15, owner_idx: 0, is_king: false },
        Tower { health: 3000, x: 0, y: 20, owner_idx: 1, is_king: true },
        Tower { health: 1500, x: -10, y: 15, owner_idx: 1, is_king: false },
        Tower { health: 1500, x: 10, y: 15, owner_idx: 1, is_king: false },
    ];
    
    Ok(())
}

pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
    ctx.accounts.delegate_pda(
        &ctx.accounts.payer,
        &[ctx.accounts.payer.key().as_ref()],
        DelegateConfig {
            validator: ctx.remaining_accounts.first().map(|acc| acc.key()),
            ..Default::default()
        },
    )?;
    Ok(())
}

pub fn deploy_troop(ctx: Context<UpdateBattle>, card_idx: u8, x: i32, y: i32) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let game = &ctx.accounts.game;
    let profile = &ctx.accounts.player_profile;
    
    let signer = ctx.accounts.signer.key();
    let player_idx = if game.players[0] == signer { 0 } else { 1 };

    if card_idx as usize >= 8 { return err!(GameError::InvalidCardIdx); }
    let card_id = profile.deck[card_idx as usize];
    if card_id == 0 { return err!(GameError::EmptyCardSlot); }

    let config = profile.inventory.iter().find(|c| c.card_id == card_id).ok_or(GameError::CardNotOwned)?;
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

    Ok(())
}

pub fn resolve_game(ctx: Context<ResolveGame>, winner_idx: Option<u8>) -> Result<()> {
    require!(ctx.accounts.authority.key().to_string() == BACKEND_AUTHORITY, GameError::Unauthorized);
    
    let battle = &ctx.accounts.battle;
    let game = &mut ctx.accounts.game;
    
    // Verify accounts passed match game players
    require!(ctx.accounts.player_one.key() == game.players[0], GameError::InvalidPlayer);
    require!(ctx.accounts.player_two.key() == game.players[1], GameError::InvalidPlayer);
    
    // Use provided winner_idx if available (Admin/Backend decision), otherwise check battle state
    let final_winner = winner_idx.or(battle.winner);

    if let Some(w_idx) = final_winner {
        game.winner = Some(game.players[w_idx as usize]);
        game.status = GameStatus::Completed;
    } else {
        // Handle draw or forced termination?
        game.winner = None; // Draw or aborted
        game.status = GameStatus::Completed;
    }
    Ok(())
}

pub fn commit_battle(ctx: Context<CommitBattle>) -> Result<()> {
    commit_accounts(
        &ctx.accounts.payer,
        vec![&ctx.accounts.battle.to_account_info()],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;
    Ok(())
}

pub fn undelegate_battle(ctx: Context<CommitBattle>) -> Result<()> {
        commit_and_undelegate_accounts(
        &ctx.accounts.payer,
        vec![&ctx.accounts.battle.to_account_info()],
        &ctx.accounts.magic_context,
        &ctx.accounts.magic_program,
    )?;
    Ok(())
}

pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let game = &mut ctx.accounts.game;
    let winner = game.winner.ok_or(GameError::GameNotFinished)?;
    let signer_key = ctx.accounts.signer.key();
    
    require!(signer_key == winner, GameError::NotWinner);
    
    let idx = if game.players[0] == winner { 0 } else { 1 };
    require!(!game.rewards_claimed[idx], GameError::AlreadyClaimed);
    
    // Mint Token
    let bump = ctx.bumps.mint_authority;
    let seeds = &[b"mint_authority".as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.destination.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, TOKEN_REWARD_AMOUNT * 1_000_000)?; 
    
    // Mint Token (already done above)
    // Update MMR
    ctx.accounts.profile.mmr += 30; // +30 MMR for win
    ctx.accounts.profile.trophies += 30; // +30 Trophies for win

    game.rewards_claimed[idx] = true;
    
    Ok(())
}
