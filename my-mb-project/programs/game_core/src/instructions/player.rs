use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::GameError;
use crate::constants::*;

use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(
        init, 
        payer = authority, 
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [b"player", authority.key().as_ref()], 
        bump
    )]
    pub profile: Account<'info, PlayerProfile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageCard<'info> {
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump)]
    pub profile: Account<'info, PlayerProfile>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)] 
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub authority: Signer<'info>,
}

pub fn initialize_player(ctx: Context<InitializePlayer>, username: String) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    profile.authority = ctx.accounts.authority.key();
    profile.mmr = 1000;    
    profile.deck = [1, 2, 3, 4, 0, 0, 0, 0]; 
    
    profile.inventory = Vec::new();
    profile.inventory.push(CardProgress { card_id: 1, level: 1, xp: 0, amount: 1 }); 
    profile.inventory.push(CardProgress { card_id: 2, level: 1, xp: 0, amount: 1 }); 
    profile.inventory.push(CardProgress { card_id: 3, level: 1, xp: 0, amount: 1 }); 
    profile.inventory.push(CardProgress { card_id: 4, level: 1, xp: 0, amount: 1 }); 
    
    profile.username = username;
    profile.trophies = 0;

    msg!("Player initialized: {}", ctx.accounts.authority.key());
    Ok(())
}

pub fn unlock_card(ctx: Context<ManageCard>, card_id: u8) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    let unlock_cost = 100;
    
    // Check if card is a starter card
    let is_starter = STARTER_CARDS.contains(&card_id);
    
    // Check if player already owns the card
    let already_owned = profile.inventory.iter().any(|c| c.card_id == card_id);

    // Burn tokens only if it's NOT a starter card OR if the player already owns it (buying duplicates)
    if !is_starter || already_owned {
        // Burn SPL Token
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        );
        anchor_spl::token::burn(cpi_ctx, unlock_cost * 1_000_000_000)?; // 9 Decimals assumption
    }

    if let Some(card) = profile.inventory.iter_mut().find(|c| c.card_id == card_id) {
         card.amount += 1;
    } else {
        if profile.inventory.len() >= MAX_INVENTORY { return err!(GameError::InventoryFull); }
        profile.inventory.push(CardProgress { card_id, level: 1, xp: 0, amount: 1 });
    }
    
    Ok(())
}

pub fn upgrade_card(ctx: Context<ManageCard>, card_id: u8) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    
    let mut card_idx = usize::MAX;
    for (i, c) in profile.inventory.iter().enumerate() {
        if c.card_id == card_id { card_idx = i; break; }
    }
    
    if card_idx == usize::MAX { return err!(GameError::CardNotOwned); }

    let current_level = profile.inventory[card_idx].level;
    let current_amount = profile.inventory[card_idx].amount;

    if current_level >= 13 { return err!(GameError::MaxLevelReached); }

    let cards_needed = (current_level as u32) * 2;
    let token_cost = 50 * (current_level as u64).pow(2);

    if current_amount < cards_needed { return err!(GameError::NotEnoughCards); }
    
    // Burn SPL Token
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        anchor_spl::token::Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    anchor_spl::token::burn(cpi_ctx, token_cost * 1_000_000_000)?;

    profile.inventory[card_idx].amount -= cards_needed;
    profile.inventory[card_idx].level += 1;
    
    msg!("Upgraded card {} to level {}", card_id, profile.inventory[card_idx].level);
    Ok(())
}

pub fn set_deck(ctx: Context<ManageCard>, new_deck: [u8; 8]) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    for &card_id in new_deck.iter() {
        if card_id != 0 {
            if !profile.inventory.iter().any(|c| c.card_id == card_id) {
                return err!(GameError::CardNotOwned);
            }
        }
    }
    profile.deck = new_deck;
    Ok(())
}
