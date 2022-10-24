const Voting = artifacts.require("./Voting.sol");

contract("Voting", accounts => {
    it("Should be true", async () => {
        assert.equal(true, true, "It's not true");
    });
});