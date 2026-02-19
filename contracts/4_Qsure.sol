// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";

contract Qsure {
    // Mapping from user address to app name to password
    mapping(address => mapping(string => string)) private passwords;

    // Event to return the password to the user, encrypted in the transaction logs
    event PasswordReturned(address indexed sender, bytes32 nonce, string app, bytes passwordcipher);

    /// @notice Add or update a password for a specific app
    /// @param app The application name
    /// @param pwd The password to store
    function addPassword(string calldata app, string calldata pwd) external {
        passwords[msg.sender][app] = pwd;
    }

    /// @notice Retrieve a password for a specific app. Emits PasswordReturned event.
    /// @param app The application name
    function getPassword(bytes32 key, string calldata app) external {
        string memory pwd = passwords[msg.sender][app];
        bytes memory pwd_bytes = bytes(pwd);
        bytes32 nonce = bytes32(Sapphire.randomBytes(32, bytes("quantumsurenonce")));
        bytes memory ad = "additional crap";
        bytes memory encrypted = Sapphire.encrypt(key, nonce, pwd_bytes, ad); 
        emit PasswordReturned(msg.sender, nonce, app, encrypted);
    }
}
