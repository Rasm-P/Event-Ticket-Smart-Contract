const hre = require("hardhat");
const readline = require("readline");

async function main() {
    const Event_ID = 0;

    // Load ticket smart contract
    const ticketContract = await hre.ethers.getContractAt(
        "TicketContract",
        process.env.TICKET_CONTRACT
    );

    // Prompt for the user to enter the address to promote
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question("Please enter the address to promote: ", async (address) => {
        // Promote address to organizer and print role
        const tx = await ticketContract.promoteToOrganizer(address);
        await tx.wait();
        const role = await ticketContract.getAccessRole(address);
        console.log("Role: ", role);

        // Set address as event venue owner of event with ID 0 and print the event owner
        const txx = await ticketContract.setEventVenueOwner(Event_ID, address);
        await txx.wait();
        const event = await ticketContract.getEventById(Event_ID);
        console.log("Event owner: ", event.venueOwner);

        rl.close();
    });
}

require("dotenv").config();
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
