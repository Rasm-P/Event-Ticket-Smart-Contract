const hre = require("hardhat");

async function main() {
    // Load ticket smart contract
    const ticketContract = await hre.ethers.getContractAt(
        "TicketContract",
        process.env.TICKET_CONTRACT
    );

    // Get smart contract address
    const tokenContractAddress = await ticketContract.getAddress();

    // Get smart contract balance
    const contractBalance = await hre.ethers.provider.getBalance(
        tokenContractAddress
    );
    const balance = hre.ethers.formatEther(contractBalance.toString());

    // Withdraw funds from smart contract
    await ticketContract.withdrawContractFunds();

    // Print balance amount withdrawn
    console.log("Withdraw sucessful: " + balance + " MATIC");
}

require("dotenv").config();
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
