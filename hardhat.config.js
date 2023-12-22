require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
            },
        },
    },
    networks: {
        mumbai: {
            url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.API_KEY}`,
            accounts: [`0x${process.env.PRIVATE_KEY}`],
        },
    },
};
