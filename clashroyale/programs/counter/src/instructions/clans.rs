use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateClan<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Clan::INIT_SPACE + 32, // Extra space for string just in case
        seeds = [b"clan", name.as_bytes()],
        bump
    )]
    pub clan: Account<'info, Clan>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + ClanMember::INIT_SPACE,
        seeds = [b"clan_member", clan.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub clan_member: Account<'info, ClanMember>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinClan<'info> {
    #[account(mut)]
    pub clan: Account<'info, Clan>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + ClanMember::INIT_SPACE,
        seeds = [b"clan_member", clan.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub clan_member: Account<'info, ClanMember>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(card_id: u8)]
pub struct RequestCards<'info> {
    pub clan: Account<'info, Clan>,
    
    #[account(
        mut,
        seeds = [b"clan_member", clan.key().as_ref(), authority.key().as_ref()],
        bump = clan_member.bump
    )]
    pub clan_member: Account<'info, ClanMember>,
    
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + DonationRequest::INIT_SPACE,
        seeds = [b"request", clan.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub request: Account<'info, DonationRequest>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DonateCards<'info> {
    #[account(mut)]
    pub clan: Account<'info, Clan>,
    
    // Donor Profile & Member
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump)]
    pub donor_profile: Account<'info, PlayerProfile>,
    #[account(
        seeds = [b"clan_member", clan.key().as_ref(), authority.key().as_ref()],
        bump = donor_member.bump
    )]
    pub donor_member: Account<'info, ClanMember>,

    // Requester Profile & Request
    #[account(mut)] // Requester profile passed to add cards
    pub requester_profile: Account<'info, PlayerProfile>,
    #[account(
        mut,
        seeds = [b"request", clan.key().as_ref(), requester_profile.authority.key().as_ref()],
        bump = request.bump
    )]
    pub request: Account<'info, DonationRequest>,

    // Reward Logic
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub donor_token_account: Account<'info, TokenAccount>,
    /// CHECK: Seeds check
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn create_clan(ctx: Context<CreateClan>, name: String) -> Result<()> {
    if name.len() > 32 { return err!(GameError::ClanNameTooLong); }
    
    let clan = &mut ctx.accounts.clan;
    clan.name = name;
    clan.leader = ctx.accounts.authority.key();
    clan.member_count = 1;
    clan.min_trophies = 0;
    clan.bump = ctx.bumps.clan;

    let member = &mut ctx.accounts.clan_member;
    member.clan = clan.key();
    member.player = ctx.accounts.authority.key();
    member.role = ClanRole::Leader;
    member.last_request_time = 0;
    member.donations_given = 0;
    member.bump = ctx.bumps.clan_member;

    Ok(())
}

pub fn join_clan(ctx: Context<JoinClan>) -> Result<()> {
    let clan = &mut ctx.accounts.clan;
    if clan.member_count >= 50 { return err!(GameError::ClanFull); }
    
    clan.member_count += 1;

    let member = &mut ctx.accounts.clan_member;
    member.clan = clan.key();
    member.player = ctx.accounts.authority.key();
    member.role = ClanRole::Member;
    member.last_request_time = 0;
    member.donations_given = 0;
    member.bump = ctx.bumps.clan_member;

    Ok(())
}

pub fn request_cards(ctx: Context<RequestCards>, card_id: u8) -> Result<()> {
    let member = &mut ctx.accounts.clan_member;
    let now = Clock::get()?.unix_timestamp;
    
    // 7 hours cooldown = 7 * 3600 = 25200
    if now - member.last_request_time < 25200 { return err!(GameError::RequestCooldown); }
    
    let req = &mut ctx.accounts.request;
    req.clan = ctx.accounts.clan.key();
    req.player = ctx.accounts.authority.key();
    req.card_id = card_id;
    req.amount_needed = 40; // Hardcoded 40 for simplicity
    req.amount_filled = 0;
    req.is_active = true;
    req.bump = ctx.bumps.request;
    
    member.last_request_time = now;
    
    Ok(())
}

pub fn donate_cards(ctx: Context<DonateCards>) -> Result<()> {
    let req = &mut ctx.accounts.request;
    if !req.is_active { return err!(GameError::RequestNotActive); }
    if req.amount_filled >= req.amount_needed { return err!(GameError::RequestFull); }
    
    if ctx.accounts.authority.key() == req.player { return err!(GameError::CannotDonateToSelf); }

    let donor = &mut ctx.accounts.donor_profile;
    let card_id = req.card_id;
    let amount_to_give: u32 = 1; // Donate 1 at a time

    let donor_card = donor.inventory.iter_mut().find(|c| c.card_id == card_id).ok_or(GameError::CardNotOwned)?;
    if donor_card.amount < amount_to_give { return err!(GameError::NotEnoughCards); }
    
    // Execute Internal Transfer
    donor_card.amount -= amount_to_give;
    
    let requester = &mut ctx.accounts.requester_profile;
    if let Some(card) = requester.inventory.iter_mut().find(|c| c.card_id == card_id) {
        card.amount += amount_to_give;
    } else {
        // Technically request shouldn't be possible if they don't have it unlocks.
        // But for safety create it.
        if requester.inventory.len() < MAX_INVENTORY {
            requester.inventory.push(CardProgress { card_id, level: 1, xp: 0, amount: amount_to_give });
        }
    }
    
    // Rewards - Mint SPL Tokens
    // Common: +5 Tokens (scalled)
    let bump = ctx.bumps.mint_authority;
    let seeds = &[b"mint_authority".as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.donor_token_account.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, 5 * 1_000_000)?; 

    req.amount_filled += amount_to_give as u8;
    if req.amount_filled >= req.amount_needed {
        req.is_active = false;
    }

    Ok(())
}
