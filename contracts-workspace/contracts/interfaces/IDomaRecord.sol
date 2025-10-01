// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDomaRecord
 * @notice Interface for Doma Record smart contract
 */
interface IDomaRecord {
    struct NameInfo {
        string sld;
        string tld;
    }

    enum ProofOfContactsSource {
        REGISTRAR,
        DOMA
    }
}
