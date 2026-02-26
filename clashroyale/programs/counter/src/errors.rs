use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("Not enough currency")]
    NotEnoughTokens,
    #[msg("Card already unlocked")]
    CardAlreadyUnlocked,
    #[msg("Inventory full")]
    InventoryFull,
    #[msg("Card not owned")]
    CardNotOwned,
    #[msg("Invalid card index")]
    InvalidCardIdx,
    #[msg("Empty card slot")]
    EmptyCardSlot,
    #[msg("Invalid card ID")]
    InvalidCardId,
    #[msg("Not enough elixir")]
    NotEnoughElixir,
    #[msg("Too many entities")]
    TooManyEntities,
    #[msg("Game not finished")]
    GameNotFinished,
    #[msg("Not winner")]
    NotWinner,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Invalid auth")]
    InvalidAuth,
    #[msg("Max level reached")]
    MaxLevelReached,
    #[msg("Not enough cards")]
    NotEnoughCards,
    #[msg("Clan full")]
    ClanFull,
    #[msg("Already in clan")]
    AlreadyInClan,
    #[msg("Clan name too long")]
    ClanNameTooLong,
    #[msg("Request cooldown active")]
    RequestCooldown,
    #[msg("Request not active")]
    RequestNotActive,
    #[msg("Request full")]
    RequestFull,
    #[msg("Cannot donate to self")]
    CannotDonateToSelf,
    #[msg("Invalid player")]
    InvalidPlayer,
    #[msg("Unauthorized")]
    Unauthorized,
    // Game lobby errors
    #[msg("Game is already full")]
    GameAlreadyFull,
    #[msg("Game is not active")]
    GameNotActive,
    #[msg("Game is not in waiting state")]
    GameNotWaiting,
    #[msg("You are not a player in this game")]
    NotAPlayer,
    #[msg("Winner has not been determined yet")]
    WinnerNotDetermined,
    #[msg("Trophies already minted for this game")]
    AlreadyMinted,
}
