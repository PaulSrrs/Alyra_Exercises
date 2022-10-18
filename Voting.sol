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
     * @dev A proposal is an idea represented by a string created by a Voter.
     * Once registered by the admin, a Voter can vote (only once) for a Proposal.
     * The voteCount value will be incremented by 1 for each vote made by a Voter.
     */
    struct Proposal {
        string description;
        uint voteCount;
        /**
         * BONUS
         * proposer's address of the proposal, can retrieve the voter with `voters` mapping
         */
        address proposerAddress;
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
    WorkflowStatus private workflowStatus = WorkflowStatus.RegisteringVoters;

    /**
     * @dev A mapping representing the voters.
     */
    mapping (address => Voter) private voters;

    /**
     * BONUS
     * @dev A uint representing the number of voters.
     */
    uint private totalVoters;

    /**
     * BONUS
     * @dev An array to store the voter's address in order to be able to reset the vote and setup a new one.
     * It's useful for the `startNewElection` bonus function
     */
    address[] private votersAddress;

    /**
     * @dev An array to store the voters proposals.
     * NOTE: a voter can propose multiple proposals.
     */
    Proposal[] private proposals;

    /**
     * @dev Events to log election state update across time
     */
    event VoterRegistered(address voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted(address voter, uint proposalId);

    /**
     * @dev Modifier to detect if the sender is a valid voter.
     */
    modifier isVoter {
        require(voters[_msgSender()].isRegistered == true, "You must be a voter to do this.");
        _;
    }

    /**
     * BONUS
     * @dev A function callable by a voter to get his proposals.
     * @return An array of Proposal
     */
    function getMyProposals() external view isVoter returns (Proposal[] memory) {
        return getVoterProposals(_msgSender());
    }

    /**
    * BONUS
    * @dev A function to get the votedProposalId of the sender.
     * Only callable by a voter. The function will revert if the sender hasn't voted yet.
     * @return A uint representing the voted proposal id.
     */
    function getMyVotedProposalId() external view isVoter returns(uint) {
        return getVoterVotedProposalId(_msgSender());
    }

    /**
     * BONUS
     * @dev A function to get the vote status of the sender.
     * Only callable by a voter.
     * @return A bool representing the vote status of the sender.
     */
    function getMyVoteStatus() external view isVoter returns(bool) {
        return getVoterVoteStatus(_msgSender());
    }

    /**
     * @param _proposalId The index of the proposal (to find it in the `proposals` array.)
     * @dev A function callable by a voter to get proposal's description.
     * @return The description of the proposal
     */
    function getProposalDescriptionById(uint _proposalId) external view isVoter returns(string memory) {
        require(proposals.length > 0, "No proposal available.");
        require(_proposalId < proposals.length, "Invalid proposal id submitted");
        return proposals[_proposalId].description;
    }

    /**
     * @dev A function callable by a voter to get the proposals.
     * @return `proposals`
     */
    function getProposals() external view isVoter returns (Proposal[] memory) {
        return proposals;
    }

    /**
     * @dev A function callable by a voter to get the total number of proposals.
     * @return `proposals` length
     */
    function getTotalProposals() external view isVoter returns (uint) {
        return proposals.length;
    }

    /**
     * BONUS
     * @dev A function callable by a voter to get the total of voters.
     * @return `totalVoters`
     */
    function getTotalVoters() external view isVoter returns (uint) {
        return totalVoters;
    }

    /**
     * @dev A function to get the winning proposal Id of the election
     * BONUS : If no vote has been submitted or if there are more than a winning proposal, the function will revert.
     * BONUS : If there are more than one winning proposal, the admin (owner of the contract) can organize a new vote
     * with the `startNewElection` function
     * @return id of the winning proposal
     */
    function getWinner() external view returns(uint) {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Votes hasn't been counted yet.");
        uint maxVote = 0;
        bool existingDraw = false;
        uint winningProposalId;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVote) {
                existingDraw = false;
                maxVote = proposals[i].voteCount;
                winningProposalId = i;
            } else if (proposals[i].voteCount == maxVote) {
                existingDraw = true;
            }
        }
        require(maxVote > 0, "Nobody vote, no winning proposal, wait for a new vote session.");
        require(!existingDraw, "There is more than one winning proposal, "
        "wait for a new vote session to determine the winning proposal.");
        return winningProposalId;
    }

    /**
     * BONUS
     * @dev A function to get the winning proposal's proposer's address
     * If no vote has been submitted or if there are more than a winner, the function will revert.
     * If there are more than one winner, the admin (owner of the contract) can organize a new vote
     * with the `startNewElection` function.
     * @return address of the winner
     */
    function getWinnerAddress() external view returns(address) {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Votes hasn't been counted yet.");
        uint maxVote = 0;
        bool existingDraw = false;
        address winner;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVote) {
                existingDraw = false;
                maxVote = proposals[i].voteCount;
                winner = proposals[i].proposerAddress;
            } else if (proposals[i].voteCount == maxVote) {
                existingDraw = true;
            }
        }
        require(maxVote > 0, "Nobody vote, no winner, wait for a new vote session.");
        require(!existingDraw, "There is more than one winner, "
        "wait for a new vote session to determine the winner.");
        return winner;
    }

    /**
     * @param _voter address of the voter
     * @dev Function to add voter. Only callable by the admin (owner of the contract).
     * Please see onlyOwner modifier of the Owner inherited contract.
     * The workflowStatus must be RegisteringVoters.
     * The function will revert if the voter registration is closed or if the voter is already registered.
     * NOTE: If successful, the function will emit `VoterRegistered` event
     */
    function registerVoter(address _voter) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "The voter registration is closed.");
        require(voters[_voter].isRegistered == false, "Voter already registered !");
        voters[_voter] = Voter(true, false, 0);
        /// BONUS : keep total voters to avoid election with only one participant
        totalVoters++;
        emit VoterRegistered(_voter);
    }

    /**
     * @param _description A description of the proposal to be added.
     * @dev A function to add a proposal to the `proposals` array.
     * Only callable by a voter. The function will revert if the description is empty, if the description already exist,
     * or if the proposal registration isn't started yet.
     * NOTE: If successful, the function will emit `ProposalRegistered` event
     */
    function registerProposal(string calldata _description) external isVoter {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "The proposal registration is closed.");

        bytes memory descriptionAsBytes = bytes(_description);
        require(descriptionAsBytes.length > 0, "Cannot use empty description for proposal.");

        require(!doesProposalExist(_description), "This proposal already exist, please try with another description.");
        emit ProposalRegistered(proposals.length);
        /// BONUS, add _msgSender() address to `votersAddress`, useful for `startNewElection` bonus function
        votersAddress.push(_msgSender());
        proposals.push(Proposal(_description, 0, _msgSender())); ///_msgSender() is a BONUS to retrieve proposal's proposer
    }

    /**
     * @param _proposalIndex The index of the proposal (to find it in the `proposals` array.)
     * @dev A function callable by a voter to vote for a proposal. Only one vote by vote.
     * The `workflowStatus` must be equal to WorkflowStatus.VotingSessionStarted.
     * There must be at lest one proposal available.
     * The _proposalIndex must be inferior than the `proposals` array length.
     * The voter (represented by the _msgSender) must have his 'hasVoted' attribute set to false.
     * NOTE: If successful, the function will emit `Voted` event
     */
    function voteForProposal(uint _proposalIndex) external isVoter {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "The vote session isn't open.");
        require(proposals.length > 0, "No proposal available.");
        require(_proposalIndex < proposals.length, "Invalid proposal id submitted");
        require(voters[_msgSender()].hasVoted == false, "You have already submitted your vote.");
        voters[_msgSender()].votedProposalId = _proposalIndex;
        voters[_msgSender()].hasVoted = true;
        proposals[_proposalIndex].voteCount++;
        emit Voted(_msgSender(), _proposalIndex);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.RegisteringVoters to WorkflowStatus.ProposalsRegistrationStarted
     * The `workflowStatus` must be equal to WorkflowStatus.RegisteringVoters.
     * There must be at least 2 different voters.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event (in `updateElectionStatus`)
     */
    function startProposalRegistration() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, "Proposal registration already started or finished,"
        " or voter registration isn't finished.");
        require(totalVoters > 1, "It must be at least 2 voters to start the proposals registration.");
        updateElectionStatus(WorkflowStatus.ProposalsRegistrationStarted);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.ProposalsRegistrationStarted to WorkflowStatus.ProposalsRegistrationEnded
     * The `workflowStatus` must be equal to WorkflowStatus.ProposalsRegistrationStarted.
     * There must be at least 2 different proposals.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event (in `updateElectionStatus`)
     */
    function endProposalRegistration() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, "Proposal registration already finished"
        " or hasn't start yet.");
        require(proposals.length > 1, "It must be at least 2 proposals to start the vote session.");
        updateElectionStatus(WorkflowStatus.ProposalsRegistrationEnded);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.ProposalsRegistrationEnded to WorkflowStatus.VotingSessionStarted
     * The `workflowStatus` must be equal to WorkflowStatus.ProposalsRegistrationEnded.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event (in `updateElectionStatus`)
     */
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, "Voting session already started or"
        " finished, or proposal registration isn't finished.");
        updateElectionStatus(WorkflowStatus.VotingSessionStarted);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.VotingSessionStarted to WorkflowStatus.VotingSessionEnded
     * The `workflowStatus` must be equal to WorkflowStatus.VotingSessionStarted.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event (in `updateElectionStatus`)
     */
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, "Voting session already finished or"
        " hasn't start yet.");
        updateElectionStatus(WorkflowStatus.VotingSessionEnded);
    }

    /**
     * @dev A function callable by the admin (owner of the contract) to update the status of the vote
     * from WorkflowStatus.VotingSessionEnded to WorkflowStatus.VotesTallied
     * The `workflowStatus` must be equal to WorkflowStatus.VotingSessionEnded.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event (in `updateElectionStatus`)
     */
    function startVoteTally() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Voting count already done, or"
        " voting session isn't finished.");
        updateElectionStatus(WorkflowStatus.VotesTallied);
    }

    /**
     * BONUS
     * @dev A function callable by the admin to reset the vote
     * The `votersAddress` array is useful to retrieve the voters in the `voters` mapping.
     * This function iterate over `votersAddress`, and, with voter's address, reset the value in the `voters` mapping.
     * It also delete the `proposals` and `votersAddress` arrays when `voters` mapping has been reset to default value.
     * The `workflowStatus` is set to WorkflowStatus.RegisteringVoters.
     * NOTE: If successful, the function will emit `WorkflowStatusChange` event (in `updateElectionStatus`)
     */
    function startNewElection() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotesTallied, "Votes hasn't been tallied yet.");
        for (uint i = 0; i < votersAddress.length; i++) {
            if (voters[votersAddress[i]].isRegistered) {
                voters[votersAddress[i]] = Voter(false, false, 0);
            }
        }
        delete proposals;
        delete votersAddress;
        totalVoters = 0;
        updateElectionStatus(WorkflowStatus.RegisteringVoters);
    }

    /**
     * BONUS
     * @dev A function to get the all voter proposals status of a voter.
     * Only callable by a voter.
     * @return An array of proposal.
     */
    function getVoterProposals(address _addr) public view isVoter returns(Proposal[] memory) {
        require(voters[_addr].isRegistered, "This voter isn't registered.");
        Proposal[] memory voterProposals = new Proposal[](getVoterProposalsLength(_addr));
        uint it;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].proposerAddress == _addr) {
                voterProposals[it] = proposals[i];
                it++;
            }
        }

        return voterProposals;
    }

    /**
     * @param _addr address of the voter to get vote
     * @dev A function to get the vote of a voter.
     * Only callable by a voter. The function will revert if the voter isn't registered or hasn't voted yet.
     * @return A uint representing the voted proposal id.
     */
    function getVoterVotedProposalId(address _addr) public view isVoter returns(uint) {
        require(voters[_addr].isRegistered, "This voter isn't registered.");
        require(voters[_addr].hasVoted, "This voter hasn't vote yet.");
        return voters[_addr].votedProposalId;
    }

    /**
     * @dev A function to get the vote status of a voter.
     * Only callable by a voter.
     * @return A bool representing the vote status of the voter.
     */
    function getVoterVoteStatus(address _addr) public view isVoter returns(bool) {
        require(voters[_addr].isRegistered, "This voter isn't registered.");
        return voters[_addr].hasVoted;
    }

    /**
     * @dev A function to check if a proposal already exist (by checking description)
     * Only callable by a voter.
     * @return A bool representing the existence of the proposal.
     */
    function doesProposalExist(string memory _description) public view returns(bool) {
       require(owner() == _msgSender() || voters[_msgSender()].isRegistered, "You are neither a voter or the owner.");
       for (uint i = 0; i < proposals.length; i++) {
            if (keccak256(abi.encodePacked((proposals[i].description))) == keccak256(abi.encodePacked((_description))))
                return true;
        }
        return false;
    }

    /**
     * @param _newWorkflowStatus new value of the `workflowStatus`
     * @dev A function to change the current election status.
     * Only callable by the admin (owner of the contract).
     */
    function updateElectionStatus(WorkflowStatus _newWorkflowStatus) private onlyOwner {
        emit WorkflowStatusChange(workflowStatus, _newWorkflowStatus);
        workflowStatus = _newWorkflowStatus;
    }

    /**
     * BONUS
     * @dev A function to get the the voter's total number of proposals,
     $ useful for array size allocation in `getVoterProposals`.
     * Only callable by a voter.
     * @return A uint representing voter's total number of proposals
     */
    function getVoterProposalsLength(address _addr) private view returns(uint) {
        require(voters[_addr].isRegistered, "This voter isn't registered.");
        uint proposalsLength;

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].proposerAddress == _addr) {
                proposalsLength++;
            }
        }

        return proposalsLength;
    }
}