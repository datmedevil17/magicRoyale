use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};
use crate::state::*;
use crate::errors::*;


#[derive(Accounts)]
pub struct DepositGold<'info> {
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump)]
    pub profile: Account<'info, PlayerProfile>,
    
    #[account(mut)]
    pub gold_mint: Account<'info, Mint>,
    #[account(mut)]
    pub source: Account<'info, TokenAccount>, // User's SPL Gold
    
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>, // Program's Vault to store deposited gold (or burn?)
    // Decision: If we mint Gold on demand, we should Burn on deposit and Mint on withdraw.
    // That keeps logic simpler (inflationary controlled by game) vs locking.
    // Let's BURN on deposit for simplicity if we are the authority. 
    // Or Transfer to Vault if we have a fixed supply.
    // Let's BURN for now (Infinite supply model like SLP).
    
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawGold<'info> {
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump)]
    pub profile: Account<'info, PlayerProfile>,
    
    #[account(mut)]
    pub gold_mint: Account<'info, Mint>,
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    
    /// CHECK: Seeds check
    #[account(seeds = [b"gold_authority"], bump)]
    pub gold_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn deposit_gold(ctx: Context<DepositGold>, amount: u64) -> Result<()> {
    // 1. Burn SPL Gold from User
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.gold_mint.to_account_info(),
            from: ctx.accounts.source.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::burn(cpi_ctx, amount)?;

    // 2. Credit Internal Gold
    let profile = &mut ctx.accounts.profile;
    profile.tokens += amount;
    
    Ok(())
}

pub fn withdraw_gold(ctx: Context<WithdrawGold>, amount: u64) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    
    if profile.tokens < amount { return err!(GameError::NotEnoughTokens); }
    
    // 1. Debit Internal Gold
    profile.tokens -= amount;

    // 2. Mint SPL Gold to User
    let bump = ctx.bumps.gold_authority;
    let signer_seeds = &[
        b"gold_authority".as_ref(),
        &[bump],
    ];
    let signers_seeds = &[&signer_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.gold_mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.gold_authority.to_account_info(),
        },
        signers_seeds,
    );
    token::mint_to(cpi_ctx, amount)?;

    Ok(())
}
