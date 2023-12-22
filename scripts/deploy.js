const hre = require("hardhat");

async function main() {
    // Load and deploy smart contracts
    const ticketContract = await hre.ethers.getContractFactory(
        "TicketContract"
    );
    const deployedTicketContract = await ticketContract.deploy(
        "TicketContract",
        "TC"
    );

    const resaleContract = await hre.ethers.getContractFactory(
        "ResaleContract"
    );
    const deployedResaleContract = await resaleContract.deploy();

    const registerContract = await hre.ethers.getContractFactory(
        "RegisterContract"
    );
    const deployedRegisterContract = await registerContract.deploy();

    // Set contract addresses between smart contracts
    await deployedTicketContract.setResaleContract(
        deployedResaleContract.target
    );
    await deployedTicketContract.setRegisterContract(
        deployedRegisterContract.target
    );
    await deployedResaleContract.setTicketContractAddress(
        deployedTicketContract.target
    );
    await deployedRegisterContract.setTicketContractAddress(
        deployedTicketContract.target
    );

    // Print addresses of deployed smart contracts
    console.log("Ticket contract address:", deployedTicketContract.target);
    console.log("Resale contract address:", deployedResaleContract.target);
    console.log("Register contract address:", deployedRegisterContract.target);
}

require("dotenv").config();
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
