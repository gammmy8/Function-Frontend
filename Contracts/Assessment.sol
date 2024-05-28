// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Assessment {
    address payable public owner;
    uint256 public balance;

    event Deposit(uint256 amount);
    event Withdraw(uint256 amount);
    event Transfer(address indexed recipient, uint256 amount);
    event ActivityLog(string action, uint256 amount, address recipient, uint256 timestamp);

    struct Activity {
        string action;
        uint256 amount;
        address recipient;
        uint256 timestamp;
    }

    Activity[] public activityLogs;

    constructor(uint initBalance) payable {
        owner = payable(msg.sender);
        balance = initBalance;
    }

    function getBalance() public view returns (uint256) {
        return balance;
    }

    function deposit(uint256 _amount) public payable {
        uint _previousBalance = balance;

        // make sure this is the owner
        require(msg.sender == owner, "You are not the owner of this account");

        // perform transaction
        balance += _amount;

        // assert transaction completed successfully
        assert(balance == _previousBalance + _amount);

        // emit the event
        emit Deposit(_amount);

        // log the activity
        activityLogs.push(Activity("Deposit", _amount, address(0), block.timestamp));
    }

    // custom error
    error InsufficientBalance(uint256 balance, uint256 withdrawAmount);

    function withdraw(uint256 _withdrawAmount) public {
        require(msg.sender == owner, "You are not the owner of this account");
        uint _previousBalance = balance;
        if (balance < _withdrawAmount) {
            revert InsufficientBalance({
                balance: balance,
                withdrawAmount: _withdrawAmount
            });
        }

        // withdraw the given amount
        balance -= _withdrawAmount;

        // assert the balance is correct
        assert(balance == (_previousBalance - _withdrawAmount));

        // emit the event
        emit Withdraw(_withdrawAmount);

        // log the activity
        activityLogs.push(Activity("Withdraw", _withdrawAmount, address(0), block.timestamp));
    }

    function transfer(address payable _recipient, uint256 _amount) public {
        require(msg.sender == owner, "You are not the owner of this account");
        require(_recipient != address(0), "Invalid recipient address");
        require(balance >= _amount, "Insufficient balance");

        uint _previousBalance = balance;

        // transfer the amount
        balance -= _amount;
        _recipient.transfer(_amount);

        // assert the balance is correct
        assert(balance == (_previousBalance - _amount));

        // emit the event
        emit Transfer(_recipient, _amount);

        // log the activity
        activityLogs.push(Activity("Transfer", _amount, _recipient, block.timestamp));
    }

    function getRecentActivity() public view returns (Activity[] memory) {
        uint256 length = activityLogs.length > 10 ? 10 : activityLogs.length;
        Activity[] memory recentActivities = new Activity[](length);
        for (uint256 i = 0; i < length; i++) {
            recentActivities[i] = activityLogs[activityLogs.length - i - 1];
        }
        return recentActivities;
    }
}
