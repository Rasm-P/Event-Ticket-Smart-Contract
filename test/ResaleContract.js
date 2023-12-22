const { expect } = require("chai");
const hre = require("hardhat");

const TICKET_CONTRACT_NAME = "TicketContract";
const TICKET_CONTRACT_SYMBOL = "TC";
const EVENT_NAME = "Test";
const EVENT_DESCRIPTION = "This is a test";
const NUMBER_OF_TICKETS = 10;
const EVENT_LOCATION = "Copenhagen, Denmark";
const EVENT_DATE = "Dec 3, 2023";
const EVENT_TIME = "3:00PM to 8:00PM";
const TICKET_PRICE = hre.ethers.parseEther("0.05");
const TICKETS_PR_CUSTOMER = 4;
const IMAGE_URL = "https://Test";
const EVENT_ID = 0;
const SEAT_NUMBER = 0;
const LISTING_ID = 0;

describe("ResaleContract", () => {
    let customer;
    let secondCustomer;
    let thirdCustomer;
    let fourthCustomer;
    let organizerAdmin;
    let ticketContract;
    let resaleContract;
    let tokenContractAddress;
    let resaleContractAddress;
    let registerContractAddress;
    let nftTicketId;

    before(async () => {
        [
            customer,
            secondCustomer,
            thirdCustomer,
            fourthCustomer,
            organizerAdmin,
            registerContractAddress,
        ] = await hre.ethers.getSigners();
        const ResaleContract = await hre.ethers.getContractFactory(
            "ResaleContract",
            organizerAdmin
        );
        resaleContract = await ResaleContract.deploy();
        resaleContractAddress = await resaleContract.getAddress();
        const TicketContract = await hre.ethers.getContractFactory(
            "TicketContract",
            organizerAdmin
        );
        ticketContract = await TicketContract.deploy(
            TICKET_CONTRACT_NAME,
            TICKET_CONTRACT_SYMBOL
        );
        tokenContractAddress = await ticketContract.getAddress();
        await resaleContract
            .connect(organizerAdmin)
            .setTicketContractAddress(tokenContractAddress);
        await ticketContract
            .connect(organizerAdmin)
            .setResaleContract(resaleContractAddress);
        await ticketContract
            .connect(organizerAdmin)
            .setRegisterContract(registerContractAddress);
        await ticketContract.connect(customer).setContractApprovals();
        await ticketContract.connect(secondCustomer).setContractApprovals();
        await ticketContract.connect(thirdCustomer).setContractApprovals();
        await ticketContract.connect(fourthCustomer).setContractApprovals();
        await ticketContract
            .connect(organizerAdmin)
            .addEvent(
                EVENT_NAME,
                EVENT_DESCRIPTION,
                NUMBER_OF_TICKETS,
                EVENT_LOCATION,
                EVENT_DATE,
                EVENT_TIME,
                TICKET_PRICE,
                TICKETS_PR_CUSTOMER,
                IMAGE_URL
            );
        await ticketContract
            .connect(customer)
            .purchaseTicket(EVENT_ID, [SEAT_NUMBER], {
                value: TICKET_PRICE,
            });
        const response = await ticketContract.connect(customer).getSenderNFTs();
        nftTicketId = response[0].tokenId;
    });

    describe("Put ticket up for resale", () => {
        it("Only ticket owner put ticket up for resale", async () => {
            await expect(
                resaleContract
                    .connect(secondCustomer)
                    .listTicketForSale(nftTicketId, TICKET_PRICE)
            ).to.rejectedWith(
                "Only the owner of the ticket can call this function!"
            );
        });

        it("Resale price cannot be zero", async () => {
            await expect(
                resaleContract
                    .connect(customer)
                    .listTicketForSale(nftTicketId, 0)
            ).to.rejectedWith("Resale price must be greater than 1 wei!");
        });

        it("Resale price cannot be higher than purchase price", async () => {
            await expect(
                resaleContract
                    .connect(customer)
                    .listTicketForSale(nftTicketId, TICKET_PRICE + BigInt(1))
            ).to.rejectedWith(
                "Resale price cannot be higher than purchase price!"
            );
        });

        it("Customer puts ticket up for resale and transfer ownership to contract", async () => {
            await resaleContract
                .connect(customer)
                .listTicketForSale(nftTicketId, TICKET_PRICE);
            const owner = await ticketContract.ownerOf(nftTicketId);

            expect(owner).to.equal(resaleContractAddress);
            expect(owner).not.to.equal(customer);
        });

        it("Ticket resale list has been updated", async () => {
            const resaleList = await resaleContract
                .connect(customer)
                .getTicketsForResale();
            const listing = resaleList[0];

            expect(resaleList.length).to.equal(1);
            expect(listing["listingId"]).to.equal(0);
            expect(listing["listingOwner"]).to.equal(customer.address);
            expect(listing["listingPrice"]).to.equal(TICKET_PRICE);
            expect(listing["hasBeenResold"]).to.equal(false);
            expect(listing["listedForResale"]).to.equal(true);
            expect(listing["tokenId"]).to.equal(nftTicketId);
            expect(listing["eventId"]).to.equal(EVENT_ID);
        });
    });

    describe("Withdraw ticket from resale", () => {
        let resaleListBefore;

        before(async () => {
            await ticketContract
                .connect(customer)
                .purchaseTicket(EVENT_ID, [SEAT_NUMBER + 1], {
                    value: TICKET_PRICE,
                });
            await resaleContract
                .connect(customer)
                .listTicketForSale(nftTicketId + BigInt(1), TICKET_PRICE);
            resaleListBefore = await resaleContract
                .connect(customer)
                .getTicketsForResale();
        });

        it("Sender must be listing owner", async () => {
            await expect(
                resaleContract
                    .connect(secondCustomer)
                    .withdrawFromResaleList(LISTING_ID + 1)
            ).to.rejectedWith("Sender must be listing owner!");
        });

        it("Customer withdraws their ticket from resale", async () => {
            await resaleContract
                .connect(customer)
                .withdrawFromResaleList(LISTING_ID + 1);
            const resaleListAfter = await resaleContract
                .connect(customer)
                .getTicketsForResale();
            const owner = await ticketContract.ownerOf(nftTicketId + BigInt(1));

            expect(resaleListAfter.length).to.equal(
                resaleListBefore.length - 1
            );
            expect(owner).not.to.equal(resaleContractAddress);
            expect(owner).to.equal(customer.address);
        });

        it("Listing must still be for sale to withdraw", async () => {
            await expect(
                resaleContract
                    .connect(customer)
                    .withdrawFromResaleList(LISTING_ID + 1)
            ).to.rejectedWith("Listing must still be for sale!");
        });
    });

    describe("Purchase ticket from resale", () => {
        before(async () => {
            for (let i = 0; i < TICKETS_PR_CUSTOMER; i++) {
                await ticketContract
                    .connect(secondCustomer)
                    .purchaseTicket(EVENT_ID, [i + 2], {
                        value: TICKET_PRICE,
                    });
            }
        });

        it("Customer cannot buy their own tickets", async () => {
            await expect(
                resaleContract
                    .connect(customer)
                    .purchaseTicketFromResale(LISTING_ID, {
                        value: TICKET_PRICE,
                    })
            ).to.rejectedWith("Customer cannot buy their own tickets!");
        });

        it("Customer ticket count for event must be lower than the limit", async () => {
            await expect(
                resaleContract
                    .connect(secondCustomer)
                    .purchaseTicketFromResale(LISTING_ID, {
                        value: TICKET_PRICE,
                    })
            ).to.rejectedWith(
                "Customer ticket count for event must be lower than the limit!"
            );
        });

        it("Sender value must equal the listing price", async () => {
            await expect(
                resaleContract
                    .connect(thirdCustomer)
                    .purchaseTicketFromResale(LISTING_ID, {
                        value: 1,
                    })
            ).to.rejectedWith("Sender value must equal the listing price!");
        });

        it("Customer purchases resale ticket", async () => {
            const sellerBalanceBefore = await hre.ethers.provider.getBalance(
                customer.address
            );
            const buyerBalanceBefore = await hre.ethers.provider.getBalance(
                thirdCustomer.address
            );
            const resaleListBefore = await resaleContract
                .connect(customer)
                .getTicketsForResale();
            await resaleContract
                .connect(thirdCustomer)
                .purchaseTicketFromResale(LISTING_ID, {
                    value: TICKET_PRICE,
                });
            const resaleListAfter = await resaleContract
                .connect(customer)
                .getTicketsForResale();
            const sellerBalanceAfter = await hre.ethers.provider.getBalance(
                customer.address
            );
            const buyerBalanceAfter = await hre.ethers.provider.getBalance(
                thirdCustomer.address
            );
            const owner = await ticketContract.ownerOf(nftTicketId);

            expect(sellerBalanceAfter).to.greaterThan(sellerBalanceBefore);
            expect(buyerBalanceAfter).to.lessThan(buyerBalanceBefore);
            expect(resaleListAfter.length).to.equal(
                resaleListBefore.length - 1
            );
            expect(owner).not.to.equal(resaleContractAddress);
            expect(owner).to.equal(thirdCustomer.address);
        });

        it("Listing must still be for sale to purchase", async () => {
            await expect(
                resaleContract
                    .connect(thirdCustomer)
                    .purchaseTicketFromResale(LISTING_ID, {
                        value: TICKET_PRICE,
                    })
            ).to.rejectedWith("Listing must still be for sale!");
        });
    });

    describe("Resale limit", () => {
        const EVENT_ID = 1;
        const SEATS = [0, 1, 2, 3];
        let tickets;

        before(async () => {
            await ticketContract
                .connect(organizerAdmin)
                .addEvent(
                    EVENT_NAME,
                    EVENT_DESCRIPTION,
                    NUMBER_OF_TICKETS,
                    EVENT_LOCATION,
                    EVENT_DATE,
                    EVENT_TIME,
                    TICKET_PRICE,
                    TICKETS_PR_CUSTOMER,
                    IMAGE_URL
                );
            await ticketContract
                .connect(fourthCustomer)
                .purchaseTicket(EVENT_ID, SEATS, {
                    value: TICKET_PRICE * BigInt(SEATS.length),
                });
            tickets = await ticketContract
                .connect(fourthCustomer)
                .getSenderNFTs();
        });

        it("Customer can list up to 3 tickets by default", async () => {
            for (let i = 0; i < SEATS.length - 1; i++) {
                await resaleContract
                    .connect(fourthCustomer)
                    .listTicketForSale(tickets[i].tokenId, TICKET_PRICE);
            }

            await expect(
                resaleContract
                    .connect(fourthCustomer)
                    .listTicketForSale(
                        tickets[SEATS.length - 1].tokenId,
                        TICKET_PRICE
                    )
            ).to.rejectedWith(
                "Customer cannot put up more listings than the listing limit!"
            );
        });

        it("Customer can fetch their listings", async () => {
            const listings = await resaleContract
                .connect(fourthCustomer)
                .getTicketsListedBySender();

            expect(listings.length).to.equal(3);
            expect(listings[0]["listingId"]).to.equal(2);
            expect(listings[0]["listingOwner"]).to.equal(
                fourthCustomer.address
            );
            expect(listings[0]["listingPrice"]).to.equal(TICKET_PRICE);
            expect(listings[0]["hasBeenResold"]).to.equal(false);
            expect(listings[0]["listedForResale"]).to.equal(true);
            expect(listings[0]["tokenId"]).to.equal(tickets[0]["tokenId"]);
            expect(listings[0]["eventId"]).to.equal(1);
            expect(listings[0]["seatNr"]).to.equal(SEATS[0]);
            expect(listings[0]["eventName"]).to.equal(EVENT_NAME);
            expect(listings[0]["eventLocation"]).to.equal(EVENT_LOCATION);
            expect(listings[0]["eventDate"]).to.equal(EVENT_DATE);
            expect(listings[0]["eventTime"]).to.equal(EVENT_TIME);
            expect(listings[0]["ticketsPrCustomer"]).to.equal(
                TICKETS_PR_CUSTOMER
            );
        });

        it("Resale limit can be changed", async () => {
            const newResaleLimit = 4;
            await resaleContract.setListingLimit(newResaleLimit);
            const resaleLimit = await resaleContract.getListingLimit();

            expect(resaleLimit).to.equal(newResaleLimit);
        });
    });
});
