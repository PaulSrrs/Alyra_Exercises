// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/// @title A smart contract which can be used to organize an election.
/// Whitelisted voters can propose proposals and vote for a proposal.
/// There will be one winning proposal at the end (or none if tie).
/// @author Paul Surrans - https://paul-surrans.fr
/// @notice A large proposal will result a higher amount spend to propose it.
/// @dev This contract inherit from Openzeppelin Ownable.sol contract in order to check ownership for some functionality.
/// Please see https://github.com/PaulSrrs/Alyra_Exercises/tree/main/Voting_Front_22_November for dApp.
contract Voting is Ownable {
  /// @notice Get the winning proposal, only useful once WorkflowStatus is VotesTallied.
  /// @return The winning proposal. 0 if it's a tie.
  uint public winningProposalID;

  struct Voter {
    bool isRegistered;
    bool hasVoted;
    uint votedProposalId;
  }

  struct Proposal {
    string description;
    uint voteCount;
  }

  enum WorkflowStatus {
    RegisteringVoters,
    ProposalsRegistrationStarted,
    ProposalsRegistrationEnded,
    VotingSessionStarted,
    VotingSessionEnded,
    VotesTallied
  }

  /// @notice Get the current vote step.
  /// @return The current vote step.
  WorkflowStatus public workflowStatus;

  Proposal[] proposalsArray;
  mapping (address => Voter) voters;

  /// @notice Event emitted when a new voter is registered.
  /// @param voterAddress Address of the registered voter.
  event VoterRegistered(address voterAddress);
  /// @notice Event emitted when vote step change.
  /// @param previousStatus Previous vote step.
  /// @param newStatus New step vote step.
  event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
  /// @notice Event emitted when a proposal is registered.
  /// @param proposalId Id of the proposal to be registered. Can be useful for `getOneProposal` function.
  event ProposalRegistered(uint proposalId);
  /// @notice Event emitted when a voter vote for a proposal.
  /// @param voter Address of the voter who voted.
  /// @param proposalId Id of the voted proposal.
  event Voted(address voter, uint proposalId);

  /// @notice Modifier to check whether the sender is a voter or not.
  modifier onlyVoters() {
    require(voters[msg.sender].isRegistered, "You're not a voter");
    _;
  }

  // on peut faire un modifier pour les états

  // ::::::::::::: GETTERS ::::::::::::: //

  /// @notice Get informations about a voter. Revert if sender isn't a voter.
  /// @param _addr Address of the voter to get info from.
  /// @return An instance of `Voter`
  function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
    return voters[_addr];
  }

  /// @notice Get informations about a proposal. Revert if sender isn't a voter.
  /// @param _id Id of the proposal to get info from.
  /// @return An instance of `Proposal`
  function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
    return proposalsArray[_id];
  }


  // ::::::::::::: REGISTRATION ::::::::::::: //

  /// @notice Add voter to `voters` mapping (whitelist). Revert if sender isn't the owner of the contract.
  /// Revert if `workflowStatus` isn't RegisteringVoters or if the voter is already registered.
  /// @param _addr Address of the voter to add.
  /// @dev Emit `VoterRegistered` on success.
  function addVoter(address _addr) external onlyOwner {
    require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
    require(voters[_addr].isRegistered != true, 'Already registered');

    voters[_addr].isRegistered = true;
    emit VoterRegistered(_addr);
  }


  // ::::::::::::: PROPOSAL ::::::::::::: //

  /// @notice Add proposal to `proposals` array. Revert if sender isn't a registered voter.
  /// Revert if `workflowStatus` isn't ProposalsRegistrationStarted or if the sent description is empty.
  /// @param _desc Description of the proposal to add.
  /// @dev Emit `ProposalRegistered` on success.
  function addProposal(string calldata _desc) external onlyVoters {
    require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
    require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Vous ne pouvez pas ne rien proposer');

    Proposal memory proposal;
    proposal.description = _desc;
    proposalsArray.push(proposal);
    emit ProposalRegistered(proposalsArray.length-1);
  }

  // ::::::::::::: VOTE ::::::::::::: //

  /// @notice Save voter's vote to a proposal with her id. Revert if sender isn't a registered voter.
  /// Revert if `workflowStatus` isn't VotingSessionStarted, if the voter has already voted or id the proposal doesn't exist.
  /// @param _id Id of the proposal to be voted.
  /// @dev Save winningProposalID if the voted proposal's voteCount is higher. Emit `Voted` on success.
  function setVote(uint _id) external onlyVoters {
    require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
    require(voters[msg.sender].hasVoted != true, 'You have already voted');
    require(_id < proposalsArray.length, 'Proposal not found'); // pas obligé, et pas besoin du >0 car uint

    voters[msg.sender].votedProposalId = _id;
    voters[msg.sender].hasVoted = true;
    proposalsArray[_id].voteCount++;

    if (proposalsArray[_id].voteCount > proposalsArray[winningProposalID].voteCount) {
      winningProposalID = _id;
    } else if (proposalsArray[_id].voteCount == proposalsArray[winningProposalID].voteCount) {
      winningProposalID = 0;
    }

    emit Voted(msg.sender, _id);
  }

  // ::::::::::::: STATE ::::::::::::: //


  /// @notice Change vote step from RegisteringVoters to ProposalsRegistrationStarted.
  /// Revert if the sender isn't the owner of the contract or if `workflowStatus` isn't RegisteringVoters.
  /// @dev Emit a 'GENESIS' proposal to deal with 0 as proposalId. Emit WorkflowStatusChange on success.
  function startProposalsRegistering() external onlyOwner {
    require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
    workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

    Proposal memory proposal;
    proposal.description = "GENESIS";
    proposalsArray.push(proposal);

    emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
  }

  /// @notice Change vote step from ProposalsRegistrationStarted to ProposalsRegistrationEnded.
  /// Revert if the sender isn't the owner of the contract or if `workflowStatus` isn't ProposalsRegistrationStarted.
  /// @dev Emit WorkflowStatusChange on success.
  function endProposalsRegistering() external onlyOwner {
    require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
    workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
    emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
  }

  /// @notice Change vote step from ProposalsRegistrationEnded to VotingSessionStarted.
  /// Revert if the sender isn't the owner of the contract or if `workflowStatus` isn't ProposalsRegistrationEnded.
  /// @dev Emit WorkflowStatusChange on success.
  function startVotingSession() external onlyOwner {
    require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
    workflowStatus = WorkflowStatus.VotingSessionStarted;
    emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
  }

  /// @notice Change vote step from VotingSessionStarted to VotingSessionEnded.
  /// Revert if the sender isn't the owner of the contract or if `workflowStatus` isn't VotingSessionStarted.
  /// @dev Emit WorkflowStatusChange on success.
  function endVotingSession() external onlyOwner {
    require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
    workflowStatus = WorkflowStatus.VotingSessionEnded;
    emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
  }

  /// @notice Change vote step from VotingSessionEnded to VotesTallied.
  /// Revert if the sender isn't the owner of the contract or if `workflowStatus` isn't VotingSessionEnded.
  /// @dev Emit WorkflowStatusChange on success.
  function tallyVotes() external onlyOwner {
    require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
    workflowStatus = WorkflowStatus.VotesTallied;
    emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
  }
}
