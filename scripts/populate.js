const hre = require("hardhat");

async function main() {
    const ticketValue = hre.ethers.parseEther("0.005");

    // Load ticket and resale smart contracts
    const ticketContract = await hre.ethers.getContractAt(
        "TicketContract",
        process.env.TICKET_CONTRACT
    );
    const resaleContract = await hre.ethers.getContractAt(
        "ResaleContract",
        process.env.RESALE_CONTRACT
    );

    // Set contract approvals for caller
    const approval = await ticketContract.setContractApprovals();
    await approval.wait();

    // Populate contract with events and print them to console
    for (let i = 0; i < 4; i++) {
        const tx = await ticketContract.addEvent(
            "Test: " + i,
            "This is a test",
            18,
            "Copenhagen, Denmark",
            "Dec 3, 2023",
            "3:00PM to 8:00PM",
            ticketValue,
            4,
            "https://lh3.googleusercontent.com/drive-viewer/AEYmBYQyeNP3jfIXJuUPyVk5jtZV_xdYQMfIwgYl5RZgkd9ARMynfxMv8ZRhccrGvFM04Q1hNAZCISFsFdpTVKuHuWs023nR6A=w1920-h955"
        );
        await tx.wait();
    }
    const events = await ticketContract.getAllEvents();
    console.log("All events: ", events);

    // Purchase an event ticket NFT token
    const purchaseTx = await ticketContract.purchaseTicket(0, [0], {
        value: ticketValue,
    });
    await purchaseTx.wait();
    const nfts = await ticketContract.getSenderNFTs();

    // List NFT token for resale and print resale list to console
    const resaleTx = await resaleContract.listTicketForSale(
        nfts[0].tokenId,
        ticketValue
    );
    await resaleTx.wait();
    const resaleList = await resaleContract.getTicketsForResale();
    console.log("Resale list: ", resaleList);
}

require("dotenv").config();
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
