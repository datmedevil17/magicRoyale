/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/game_core.json`.
 */
export type GameCore = {
  "address": "DNsfEAur359Xv18MT1nxfEqh3YGZmhwfnm454wmYkVE1",
  "metadata": {
    "name": "gameCore",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createClan",
      "discriminator": [
        89,
        254,
        237,
        205,
        249,
        101,
        142,
        223
      ],
      "accounts": [
        {
          "name": "clan",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  110
                ]
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "clanMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  110,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "clan"
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        }
      ]
    },
    {
      "name": "createGame",
      "discriminator": [
        124,
        69,
        75,
        66,
        184,
        220,
        72,
        206
      ],
      "accounts": [
        {
          "name": "battle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "playerOneProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "playerOne"
              }
            ]
          }
        },
        {
          "name": "playerOne",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "delegateGame",
      "discriminator": [
        116,
        183,
        70,
        107,
        112,
        223,
        122,
        210
      ],
      "accounts": [
        {
          "name": "payer",
          "signer": true
        },
        {
          "name": "bufferPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  102,
                  102,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                183,
                230,
                184,
                115,
                252,
                219,
                130,
                75,
                127,
                15,
                139,
                9,
                202,
                229,
                242,
                34,
                207,
                66,
                59,
                252,
                127,
                182,
                211,
                145,
                45,
                39,
                236,
                72,
                232,
                89,
                255,
                10
              ]
            }
          }
        },
        {
          "name": "delegationRecordPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "delegationMetadataPda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  105,
                  111,
                  110,
                  45,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97
                ]
              },
              {
                "kind": "account",
                "path": "pda"
              }
            ],
            "program": {
              "kind": "account",
              "path": "delegationProgram"
            }
          }
        },
        {
          "name": "pda",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "ownerProgram",
          "address": "DNsfEAur359Xv18MT1nxfEqh3YGZmhwfnm454wmYkVE1"
        },
        {
          "name": "delegationProgram",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deployTroop",
      "discriminator": [
        158,
        193,
        36,
        201,
        175,
        192,
        250,
        236
      ],
      "accounts": [
        {
          "name": "battle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "playerProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "sessionToken",
          "optional": true
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        },
        {
          "name": "cardIdx",
          "type": "u8"
        },
        {
          "name": "x",
          "type": "i32"
        },
        {
          "name": "y",
          "type": "i32"
        }
      ]
    },
    {
      "name": "donateCards",
      "discriminator": [
        89,
        151,
        75,
        56,
        254,
        87,
        126,
        178
      ],
      "accounts": [
        {
          "name": "clan",
          "writable": true
        },
        {
          "name": "donorProfile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "donorMember",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  110,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "clan"
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "requesterProfile",
          "writable": true
        },
        {
          "name": "request",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "clan"
              },
              {
                "kind": "account",
                "path": "requester_profile.authority",
                "account": "playerProfile"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "donorTokenAccount",
          "writable": true
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "endGame",
      "discriminator": [
        224,
        135,
        245,
        99,
        67,
        175,
        121,
        252
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "battle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "magicProgram",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magicContext",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        },
        {
          "name": "isTimeout",
          "type": "bool"
        }
      ]
    },
    {
      "name": "exportNft",
      "discriminator": [
        158,
        245,
        88,
        10,
        98,
        141,
        173,
        54
      ],
      "accounts": [
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "destination",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "cardMintState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  114,
                  100,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "nftAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  102,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "metadataProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "cardId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "exportResource",
      "discriminator": [
        141,
        59,
        69,
        157,
        212,
        223,
        39,
        138
      ],
      "accounts": [
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "resourceMint",
          "writable": true
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "resourceAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  115,
                  111,
                  117,
                  114,
                  99,
                  101,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "cardId",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u32"
        }
      ]
    },
    {
      "name": "importResource",
      "discriminator": [
        215,
        192,
        80,
        211,
        38,
        83,
        233,
        152
      ],
      "accounts": [
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "resourceMint",
          "writable": true
        },
        {
          "name": "source",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "cardId",
          "type": "u8"
        },
        {
          "name": "amount",
          "type": "u32"
        }
      ]
    },
    {
      "name": "initializePlayer",
      "discriminator": [
        79,
        249,
        88,
        177,
        220,
        62,
        56,
        128
      ],
      "accounts": [
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "username",
          "type": "string"
        }
      ]
    },
    {
      "name": "joinClan",
      "discriminator": [
        218,
        113,
        190,
        239,
        4,
        91,
        106,
        206
      ],
      "accounts": [
        {
          "name": "clan",
          "writable": true
        },
        {
          "name": "clanMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  110,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "clan"
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinGame",
      "discriminator": [
        107,
        112,
        18,
        38,
        56,
        173,
        60,
        128
      ],
      "accounts": [
        {
          "name": "battle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "playerTwoProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "playerTwo"
              }
            ]
          }
        },
        {
          "name": "playerTwo",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "mintTrophies",
      "discriminator": [
        43,
        167,
        115,
        22,
        194,
        59,
        61,
        99
      ],
      "accounts": [
        {
          "name": "battle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  97,
                  116,
                  116,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "gameId"
              }
            ]
          }
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "signer"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "mintAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "signer",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "gameId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processUndelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "baseAccount",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "accountSeeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "requestCards",
      "discriminator": [
        7,
        238,
        8,
        39,
        188,
        110,
        76,
        241
      ],
      "accounts": [
        {
          "name": "clan"
        },
        {
          "name": "clanMember",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  108,
                  97,
                  110,
                  95,
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "clan"
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "request",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  113,
                  117,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "clan"
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "cardId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "setDeck",
      "discriminator": [
        27,
        187,
        7,
        138,
        227,
        128,
        88,
        180
      ],
      "accounts": [
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newDeck",
          "type": {
            "array": [
              "u8",
              8
            ]
          }
        }
      ]
    },
    {
      "name": "unlockCard",
      "discriminator": [
        50,
        235,
        118,
        114,
        142,
        155,
        83,
        176
      ],
      "accounts": [
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "cardId",
          "type": "u8"
        }
      ]
    },
    {
      "name": "upgradeCard",
      "discriminator": [
        192,
        16,
        120,
        220,
        55,
        173,
        65,
        234
      ],
      "accounts": [
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  121,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "cardId",
          "type": "u8"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "battleState",
      "discriminator": [
        106,
        85,
        43,
        49,
        97,
        18,
        43,
        245
      ]
    },
    {
      "name": "cardMintState",
      "discriminator": [
        251,
        17,
        76,
        224,
        90,
        173,
        223,
        58
      ]
    },
    {
      "name": "clan",
      "discriminator": [
        179,
        33,
        233,
        29,
        6,
        237,
        105,
        241
      ]
    },
    {
      "name": "clanMember",
      "discriminator": [
        40,
        179,
        94,
        64,
        102,
        181,
        208,
        153
      ]
    },
    {
      "name": "donationRequest",
      "discriminator": [
        93,
        127,
        38,
        133,
        130,
        151,
        28,
        63
      ]
    },
    {
      "name": "playerProfile",
      "discriminator": [
        82,
        226,
        99,
        87,
        164,
        130,
        181,
        80
      ]
    },
    {
      "name": "sessionToken",
      "discriminator": [
        233,
        4,
        115,
        14,
        46,
        21,
        1,
        15
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notEnoughTokens",
      "msg": "Not enough currency"
    },
    {
      "code": 6001,
      "name": "cardAlreadyUnlocked",
      "msg": "Card already unlocked"
    },
    {
      "code": 6002,
      "name": "inventoryFull",
      "msg": "Inventory full"
    },
    {
      "code": 6003,
      "name": "cardNotOwned",
      "msg": "Card not owned"
    },
    {
      "code": 6004,
      "name": "invalidCardIdx",
      "msg": "Invalid card index"
    },
    {
      "code": 6005,
      "name": "emptyCardSlot",
      "msg": "Empty card slot"
    },
    {
      "code": 6006,
      "name": "invalidCardId",
      "msg": "Invalid card ID"
    },
    {
      "code": 6007,
      "name": "notEnoughElixir",
      "msg": "Not enough elixir"
    },
    {
      "code": 6008,
      "name": "tooManyEntities",
      "msg": "Too many entities"
    },
    {
      "code": 6009,
      "name": "gameNotFinished",
      "msg": "Game not finished"
    },
    {
      "code": 6010,
      "name": "notWinner",
      "msg": "Not winner"
    },
    {
      "code": 6011,
      "name": "alreadyClaimed",
      "msg": "Already claimed"
    },
    {
      "code": 6012,
      "name": "invalidAuth",
      "msg": "Invalid auth"
    },
    {
      "code": 6013,
      "name": "maxLevelReached",
      "msg": "Max level reached"
    },
    {
      "code": 6014,
      "name": "notEnoughCards",
      "msg": "Not enough cards"
    },
    {
      "code": 6015,
      "name": "clanFull",
      "msg": "Clan full"
    },
    {
      "code": 6016,
      "name": "alreadyInClan",
      "msg": "Already in clan"
    },
    {
      "code": 6017,
      "name": "clanNameTooLong",
      "msg": "Clan name too long"
    },
    {
      "code": 6018,
      "name": "requestCooldown",
      "msg": "Request cooldown active"
    },
    {
      "code": 6019,
      "name": "requestNotActive",
      "msg": "Request not active"
    },
    {
      "code": 6020,
      "name": "requestFull",
      "msg": "Request full"
    },
    {
      "code": 6021,
      "name": "cannotDonateToSelf",
      "msg": "Cannot donate to self"
    },
    {
      "code": 6022,
      "name": "invalidPlayer",
      "msg": "Invalid player"
    },
    {
      "code": 6023,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6024,
      "name": "gameAlreadyFull",
      "msg": "Game is already full"
    },
    {
      "code": 6025,
      "name": "gameNotActive",
      "msg": "Game is not active"
    },
    {
      "code": 6026,
      "name": "gameNotWaiting",
      "msg": "Game is not in waiting state"
    },
    {
      "code": 6027,
      "name": "notAPlayer",
      "msg": "You are not a player in this game"
    },
    {
      "code": 6028,
      "name": "winnerNotDetermined",
      "msg": "Winner has not been determined yet"
    },
    {
      "code": 6029,
      "name": "alreadyMinted",
      "msg": "Trophies already minted for this game"
    }
  ],
  "types": [
    {
      "name": "battleState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "gameId",
            "type": "u64"
          },
          {
            "name": "players",
            "type": {
              "array": [
                "pubkey",
                2
              ]
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "gameStatus"
              }
            }
          },
          {
            "name": "tickCount",
            "type": "u64"
          },
          {
            "name": "elixir",
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          },
          {
            "name": "towers",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "tower"
                  }
                },
                6
              ]
            }
          },
          {
            "name": "entities",
            "type": {
              "vec": {
                "defined": {
                  "name": "entity"
                }
              }
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "trophiesMinted",
            "type": "bool"
          },
          {
            "name": "towersDestroyed",
            "docs": [
              "How many of the enemy's towers each player has destroyed (princess only)"
            ],
            "type": {
              "array": [
                "u8",
                2
              ]
            }
          },
          {
            "name": "damageDealt",
            "docs": [
              "Total HP damage dealt to enemy towers by each player"
            ],
            "type": {
              "array": [
                "u64",
                2
              ]
            }
          }
        ]
      }
    },
    {
      "name": "cardMintState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "cardId",
            "type": "u8"
          },
          {
            "name": "level",
            "type": "u8"
          },
          {
            "name": "xp",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "cardProgress",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "cardId",
            "type": "u8"
          },
          {
            "name": "level",
            "type": "u8"
          },
          {
            "name": "xp",
            "type": "u16"
          },
          {
            "name": "amount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "clan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "leader",
            "type": "pubkey"
          },
          {
            "name": "memberCount",
            "type": "u8"
          },
          {
            "name": "minTrophies",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "clanMember",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clan",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": {
              "defined": {
                "name": "clanRole"
              }
            }
          },
          {
            "name": "lastRequestTime",
            "type": "i64"
          },
          {
            "name": "donationsGiven",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "clanRole",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "member"
          },
          {
            "name": "elder"
          },
          {
            "name": "coLeader"
          },
          {
            "name": "leader"
          }
        ]
      }
    },
    {
      "name": "donationRequest",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "clan",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "cardId",
            "type": "u8"
          },
          {
            "name": "amountNeeded",
            "type": "u8"
          },
          {
            "name": "amountFilled",
            "type": "u8"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "entity",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u32"
          },
          {
            "name": "ownerIdx",
            "type": "u8"
          },
          {
            "name": "cardId",
            "type": "u8"
          },
          {
            "name": "x",
            "type": "i32"
          },
          {
            "name": "y",
            "type": "i32"
          },
          {
            "name": "health",
            "type": "i32"
          },
          {
            "name": "damage",
            "type": "i32"
          },
          {
            "name": "state",
            "type": {
              "defined": {
                "name": "entityState"
              }
            }
          },
          {
            "name": "targetId",
            "type": {
              "option": "u32"
            }
          }
        ]
      }
    },
    {
      "name": "entityState",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "idle"
          },
          {
            "name": "moving"
          },
          {
            "name": "attacking"
          },
          {
            "name": "dead"
          }
        ]
      }
    },
    {
      "name": "gameStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "waiting"
          },
          {
            "name": "active"
          },
          {
            "name": "completed"
          }
        ]
      }
    },
    {
      "name": "playerProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "mmr",
            "type": "u32"
          },
          {
            "name": "deck",
            "type": {
              "array": [
                "u8",
                8
              ]
            }
          },
          {
            "name": "inventory",
            "type": {
              "vec": {
                "defined": {
                  "name": "cardProgress"
                }
              }
            }
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "trophies",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "sessionToken",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "targetProgram",
            "type": "pubkey"
          },
          {
            "name": "sessionSigner",
            "type": "pubkey"
          },
          {
            "name": "validUntil",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "tower",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "health",
            "type": "i32"
          },
          {
            "name": "x",
            "type": "i32"
          },
          {
            "name": "y",
            "type": "i32"
          },
          {
            "name": "ownerIdx",
            "type": "u8"
          },
          {
            "name": "isKing",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
