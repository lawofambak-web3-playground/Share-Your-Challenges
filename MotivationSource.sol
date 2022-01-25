// SPDX-License-Identifier: UNCLICENSED

pragma solidity ^0.8.0;

contract MotivationSource {
    uint256 totalChallengesShared;

    // This variable will be used to help generate a random number
    uint256 private seed;

    // Creating a new event
    event NewChallenge(address indexed from, uint256 timestamp, string message);

    // Creating a struct that stores whatever we want it to store
    struct Challenge {
        address challenger;
        string message;
        uint256 timestamp;
    }

    // Declaring an array of structs
    Challenge[] challenges;

    // Creating a mapping to associate an address with an integer
    mapping(address => uint256) public lastShare;

    constructor() payable {
        /*
         * Set the initial seed
         */
        seed = (block.timestamp + block.difficulty) % 100;
    }

    // Share challenge function
    function shareChallenge(string memory _message) public {
        /*
         * Making sure current timestamp is at least 15-minutes bigger than the last timestamp stored
         */
        require(
            lastShare[msg.sender] + 15 minutes < block.timestamp,
            "Wait 15 minutes"
        );

        /*
         * Update current timestamp for the user
         */
        lastShare[msg.sender] = block.timestamp;

        totalChallengesShared += 1;

        // Storing data in the array
        challenges.push(Challenge(msg.sender, _message, block.timestamp));

        /*
         * Generate a new seed for the next user that shares a challenge
         */
        seed = (block.difficulty + block.timestamp + seed) % 100;

        /*
         * Give a 20% chance that the user wins the prize.
         */
        if (seed <= 20) {
            uint256 prizeAmount = 0.0001 ether;

            // Requires that contract has enough ether to give out
            require(
                address(this).balance >= prizeAmount,
                "Contract does not have enough funds."
            );

            // Sending the prize amount ether
            (bool success, ) = (msg.sender).call{value: prizeAmount}("");
            require(success, "Failed to withdraw money from contract.");
        }

        // Emit event
        emit NewChallenge(msg.sender, block.timestamp, _message);
    }

    // Function that returns the struct array
    function getAllChallenges() public view returns (Challenge[] memory) {
        return challenges;
    }

    // Function that returns the total number of challenges shared
    function getTotalChallengesShared() public view returns (uint256) {
        return totalChallengesShared;
    }
}
