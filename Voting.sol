// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

/**
 * @author Paul Surrans - https://paul-surrans.fr
 * @title Voting contract
 * @dev A contract made during my Alyra formation which provides a basic vote system.
 * There is an account (an owner) that can administrate the vote and his status and get exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract.
 * This can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
contract Voting is Ownable {
    /**
     * @dev A voter is a person (represented by his address) which can participate to the vote launched by
     * the admin (the owner).
     * The votedProposalId attribute can be accessible for another voter with the `getVote` function.
     */
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    /**
     * @dev A proposal is an idea representated by a string created by a Voter.
     * Once registered by the admin, a Voter can vote (only once) for a Proposal.
     * The voteCount value will be incremented by 1 for each vote made by a Voter.
     */
    struct Proposal {
        string description;
        uint voteCount;
    }

    /**
     * @dev The WorkflowStatus enum represent the current status of the vote.
     */
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /**
     * @dev Implementation of WorkflowStatus.
     * It can only be changed by the admin (owner of the contract).
     */
    WorkflowStatus workflowStatus = WorkflowStatus.RegisteringVoters;

    /**
     * @dev A mapping representing the voters.
     */
    mapping (address => Voter) private voters;

    /**
     * @dev An array to store the voter's address in order to be able to reset the vote and setup a new one. 
     * A voter address will be added for each proposal. A single address can be present multiple time in this array.
     * It will be useful to retrieve the winner at the end of the vote. Please see `getWinner` for more details.
     */
    address[] private votersAddress;

    /**
     * @dev An array to store the voter's proposal.
     * NOTE: a voter can propose multiple proposals.
     */
    Proposal[] private proposals;

    /**
     * @dev Events to track vote evolution accross time.
     */
    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);
    event ResetVote(uint timestamp);

    /**
     * @dev Modifier to detect if the sender is a valid voter.
     */
    modifier isVoter {
        require(voters[msg.sender].isRegistered == true, "You must be a voter to do this.");
        _;
    }

    /**
     * @param _voter address of the voter
     * @dev Function to add voter. Only callable by the admin (owner of the contract).
     * Please see onlyOwner modifier of the Owner inherited contract.
     * The workflowStatus must be RegisteringVoters.
     * The function will revert if the voter registration is closed or if the voter is already registered.
     * NOTE: If successfull, the function will emit `VoterRegistered` event
     */
    function addVoter(address _voter) public onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "The voter registration is closed.");
        require(voters[_voter].isRegistered == false, "Voter already registered !");
        voters[_voter] = Voter(true, false, 0);
        emit VoterRegistered(_voter);
    }

    /**
     * @param _addr address of the voter to get vote
     * @dev A function to get the vote of a voter.
     * Only callable by a voter. The function will revert if the voter hasn't vote ye
     * @return A uint representing the voted proposal id. 
     */
    function getVote(address _addr) public view isVoter returns(uint) {
        require(voters[_addr].hasVoted, "This voter hasn't vote yet.");
        return voters[_addr].votedProposalId;
    }

    /**
     * @dev A function to get the vote status, onyl callable by a voter.
     * @return WorkflowStatus, enum representing the state of the
     */
    function getVoteStatus() public view isVoter returns(WorkflowStatus){
        return workflowStatus;
    }

    /**
     * @param _description A description of the proposal to be added.
     * @dev A function to add a proposal to the `proposals` array.
     * Only callable by a voter. The function will revert if the description is empty or
     * if the proposal registration is empty.
     * NOTE: If successfull, the function will emit `ProposalRegistered` event
     */
    function registerProposal(string calldata _description) public isVoter {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "The proposal registration is closed.");
        bytes memory descriptionAsBytes = bytes(_description);
        require(descriptionAsBytes.length > 0, "Cannot use empty description for proposal.");
        emit ProposalRegistered(proposals.length);
        votersAddress.push(msg.sender);
        proposals.push(Proposal(_description, 0));
    }

    /**
     * @param _proposalIndex The index of the proposal (to find it in the `proposals` array.)
     * @dev A function callable by a voter to vote for a proposal. Only one vote by vote.
     * The `workflowStatus` must be equal to WorkflowStatus.VotingSessionStarted.
     * There must be at lest one proposal available.
     * The _proposalIndex must be inferior than the `proposals` array length.
     * The voter (represented by the msg.sender) must have his 'hasVoted' attribute set to false. 
     * NOTE: If successful, the function will emit `Voted` event
     */
    function voteForProposal(uint _proposalIndex) public isVoter {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "The vote session isn't open.");
        require(proposals.length > 0, "No proposal available.");
        require(_proposalIndex < proposals.length, "Invalid proposal id submitted");
        require(voters[msg.sender].hasVoted == false, "Voter has already submitted his vote.");
        voters[msg.sender].votedProposalId = _proposalIndex;
        voters[msg.sender].hasVoted = true;
        proposals[_proposalIndex].voteCount++;
        emit Voted(msg.sender, _proposalIndex);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.RegisteringVoters to WorkflowStatus.ProposalsRegistrationStarted
     * The `workflowStatus` must be equal to WorkflowStatus.RegisteringVoters.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event
     */
    function startProposalRegistration() public onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Proposal registration has already start or is finished.");
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /**
    * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.ProposalsRegistrationStarted to WorkflowStatus.ProposalsRegistrationEnded
     * The `workflowStatus` must be equal to WorkflowStatus.ProposalsRegistrationStarted.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event
     */
    function endProposalRegistration() public onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration hasn't start yet.");
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.ProposalsRegistrationEnded to WorkflowStatus.VotingSessionStarted
     * The `workflowStatus` must be equal to WorkflowStatus.ProposalsRegistrationEnded.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event
     */
    function startVotingSession() public onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, "Proposal registration hasn't start yet or isn't finished.");
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.VotingSessionStarted to WorkflowStatus.VotingSessionEnded
     * The `workflowStatus` must be equal to WorkflowStatus.VotingSessionStarted.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event
     */
    function endVotingSession() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "Voting session hasn't start yet.");
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.VotingSessionEnded to WorkflowStatus.VotesTallied
     * The `workflowStatus` must be equal to WorkflowStatus.VotingSessionEnded.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event
     */
    function countVotes() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Voting session hasn't finished yet.");
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }

    /**
     * @dev A function to get the winner of the vote
     * If no vote has been submitted or if there are more than one winner, the function will revert.
     * If there are more than one winner, the admin (owner of the contract) can organize a new vote with the `resetVote` function
     * The winner is find thanks to `votersAddress` array. The index of the proposal with the more votes is the same as the
     * the votersAddress winner. (both array have the same length).
     * @return address of the winner
     */
    function getWinner() public view returns(address) {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Votes hasn't been counted yet.");
        uint maxVote = 0;
        bool existingDraw = false;
        address winner;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVote) {
                existingDraw = false;
                maxVote = proposals[i].voteCount;
                winner = votersAddress[i];
            } else if (proposals[i].voteCount == maxVote) {
                existingDraw = true;
            }
        }
        require(maxVote > 0, "Nobody vote, no winner, wait for a new vote session.");
        require(!existingDraw, "It seems that it is that there is more than 1 winner, wait for a new vote session to determine the winner.");
        return winner;
    }

    /**
     * @dev A function callable by the admin to reset the vote
     * The `votersAddress` array is useful to retrieve the voter in the `voters` mapping.
     * This function iterate over `votersAddress`, and, with voter's address, reset the value in the `voters` mapping.
     * It also delete the `proposals` and `votersAddress` arrays when `voters` mapping has been reset to default value.
     * The `workflowStatus` is set to WorkflowStatus.RegisteringVoters.
     * NOTE: If successful, the function will emit WorkflowStatusChange and ResetVote events
     */
    function resetVote() public onlyOwner {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Votes hasn't been tallied yet.");
        for (uint i = 0; i < votersAddress.length; i++) {
            if (voters[votersAddress[i]].isRegistered) {
                voters[votersAddress[i]] = Voter(false, false, 0);
            }
        }
        delete proposals;
        delete votersAddress;
        workflowStatus = WorkflowStatus.RegisteringVoters;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.RegisteringVoters);
        emit ResetVote(block.timestamp);
    }
}