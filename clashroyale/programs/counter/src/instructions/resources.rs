use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_metadata_accounts_v3,
    CreateMetadataAccountsV3,
    mpl_token_metadata::types::DataV2,
};
use crate::state::*;
use crate::errors::GameError;
use crate::constants::*;

#[derive(Accounts)]
pub struct ExportResource<'info> {
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump)]
    pub profile: Account<'info, PlayerProfile>,
    
    #[account(mut)]
    pub resource_mint: Account<'info, Mint>, 
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    
    /// CHECK: Seeds check for mint authority
    #[account(seeds = [b"resource_authority"], bump)]
    pub resource_authority: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ImportResource<'info> {
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump)]
    pub profile: Account<'info, PlayerProfile>,
    
    #[account(mut)]
    pub resource_mint: Account<'info, Mint>,
    #[account(mut)]
    pub source: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExportNft<'info> {
    #[account(mut, seeds = [b"player", authority.key().as_ref()], bump)]
    pub profile: Account<'info, PlayerProfile>,

    // New Mint for the NFT
    #[account(init, payer = authority, mint::decimals = 0, mint::authority = authority)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, associated_token::mint = mint, associated_token::authority = authority)]
    pub destination: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = 8 + CardMintState::INIT_SPACE,
        seeds = [b"card_mint", mint.key().as_ref()],
        bump
    )]
    pub card_mint_state: Account<'info, CardMintState>,

    /// CHECK: Metaplex Metadata Account
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: NFT Authority PDA to freeze/update later
    #[account(seeds = [b"nft_authority"], bump)]
    pub nft_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: Metaplex Program ID
    pub metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    #[account(mut)]
    pub authority: Signer<'info>,
}


pub fn export_resource(ctx: Context<ExportResource>, card_id: u8, amount: u32) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    let card = profile.inventory.iter_mut().find(|c| c.card_id == card_id).ok_or(GameError::CardNotOwned)?;
    
    if card.amount < amount { return err!(GameError::NotEnoughCards); }
    
    // Burn from inventory (logic only, user burns spl later)
    card.amount -= amount;

    // Mint SPL Tokens
    let bump = ctx.bumps.resource_authority;
    let signer_seeds = &[
        b"resource_authority".as_ref(),
        &[bump],
    ];
    let signers_seeds = &[&signer_seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.resource_mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.resource_authority.to_account_info(),
        },
        signers_seeds,
    );
    token::mint_to(cpi_ctx, amount as u64)?; 

    Ok(())
}

pub fn import_resource(ctx: Context<ImportResource>, card_id: u8, amount: u32) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.resource_mint.to_account_info(),
            from: ctx.accounts.source.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::burn(cpi_ctx, amount as u64)?;

    if let Some(card) = profile.inventory.iter_mut().find(|c| c.card_id == card_id) {
            card.amount += amount;
    } else {
        if profile.inventory.len() >= MAX_INVENTORY { return err!(GameError::InventoryFull); }
            profile.inventory.push(CardProgress { card_id, level: 1, xp: 0, amount });
    }
    
    Ok(())
}

pub fn export_nft(ctx: Context<ExportNft>, card_id: u8) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    
    let index = profile.inventory.iter().position(|c| c.card_id == card_id).ok_or(GameError::CardNotOwned)?;
    let card = profile.inventory.remove(index);

    let card_mint_state = &mut ctx.accounts.card_mint_state;
    card_mint_state.card_id = card.card_id;
    card_mint_state.level = card.level;
    card_mint_state.xp = card.xp;
    card_mint_state.bump = ctx.bumps.card_mint_state;

    // Mint To User
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(), 
        },
    );
    token::mint_to(cpi_ctx, 1)?;

    // Create Metadata
    let _seeds = &[
        b"metadata",
        ctx.accounts.metadata_program.key().as_ref(),
        ctx.accounts.mint.key().as_ref(),
    ];
    
    let bump = ctx.bumps.nft_authority;
    let signer_seeds = &[
        b"nft_authority".as_ref(),
        &[bump],
    ];
    let signers_seeds = &[&signer_seeds[..]];

    let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(), 
                payer: ctx.accounts.authority.to_account_info(),
                update_authority: ctx.accounts.nft_authority.to_account_info(), 
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            signers_seeds 
    );

    let data = DataV2 {
        name: format!("Card #{} (Lvl {})", card.card_id, card.level),
        symbol: "CRNFT".to_string(),
        uri: "https://example.com/metadata.json".to_string(), 
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    create_metadata_accounts_v3(
        cpi_context,
        data,
        true, 
        true,
        None,
    )?;

    Ok(())
}
