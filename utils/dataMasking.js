/**
 * Data Masking Utility
 * 
 * Provides functions to mask sensitive data in transaction responses
 * to protect customer privacy and comply with data protection regulations.
 */

const logger = require('../config/winston');

/**
 * Mask account number - shows only last 4 digits
 * @param {string} accountNumber - Full account number
 * @returns {string} Masked account number
 */
function maskAccountNumber(accountNumber) {
    if (!accountNumber || typeof accountNumber !== 'string') {
        return accountNumber;
    }
    
    const length = accountNumber.length;
    if (length <= 4) {
        return 'XXXX';
    }
    
    const lastFour = accountNumber.slice(-4);
    const maskedPart = 'X'.repeat(length - 4);
    return maskedPart + lastFour;
}

/**
 * Mask customer name - shows only first name and last initial
 * @param {string} fullName - Full customer name
 * @returns {string} Masked name
 */
function maskCustomerName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
        return fullName;
    }
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
        return nameParts[0].charAt(0) + 'XXXXX';
    }
    
    const firstName = nameParts[0];
    const lastInitial = nameParts[nameParts.length - 1].charAt(0);
    return `${firstName} ${lastInitial}.`;
}

/**
 * Mask BVN - shows only last 3 digits
 * @param {string} bvn - Bank Verification Number
 * @returns {string} Masked BVN
 */
function maskBVN(bvn) {
    if (!bvn || typeof bvn !== 'string') {
        return bvn;
    }
    
    const length = bvn.length;
    if (length <= 3) {
        return 'XXX';
    }
    
    const lastThree = bvn.slice(-3);
    const maskedPart = 'X'.repeat(length - 3);
    return maskedPart + lastThree;
}

/**
 * Mask sensitive fields in a bank loan object
 * @param {Object} loan - Bank loan object
 * @returns {Object} Loan object with masked sensitive fields
 */
function maskBankLoan(loan) {
    if (!loan || typeof loan !== 'object') {
        return loan;
    }
    
    const maskedLoan = { ...loan };
    
    // Mask customer information
    if (maskedLoan.CustomerName) {
        maskedLoan.CustomerName = maskCustomerName(maskedLoan.CustomerName);
    }
    
    if (maskedLoan.CustomerAccountNumber) {
        maskedLoan.CustomerAccountNumber = maskAccountNumber(maskedLoan.CustomerAccountNumber);
    }
    
    if (maskedLoan.CustomerBvn) {
        maskedLoan.CustomerBvn = maskBVN(maskedLoan.CustomerBvn);
    }
    
    return maskedLoan;
}

/**
 * Mask sensitive fields in a P2P transfer object
 * @param {Object} transfer - P2P transfer object
 * @returns {Object} Transfer object with masked sensitive fields
 */
function maskP2PTransfer(transfer) {
    if (!transfer || typeof transfer !== 'object') {
        return transfer;
    }
    
    const maskedTransfer = { ...transfer };
    
    // Mask sender information
    if (maskedTransfer.SenderName) {
        maskedTransfer.SenderName = maskCustomerName(maskedTransfer.SenderName);
    }
    
    if (maskedTransfer.SenderAccountNumber) {
        maskedTransfer.SenderAccountNumber = maskAccountNumber(maskedTransfer.SenderAccountNumber);
    }
    
    if (maskedTransfer.SenderBvn) {
        maskedTransfer.SenderBvn = maskBVN(maskedTransfer.SenderBvn);
    }
    
    // Mask receiver information
    if (maskedTransfer.ReceiverName) {
        maskedTransfer.ReceiverName = maskCustomerName(maskedTransfer.ReceiverName);
    }
    
    if (maskedTransfer.ReceiverAccountNumber) {
        maskedTransfer.ReceiverAccountNumber = maskAccountNumber(maskedTransfer.ReceiverAccountNumber);
    }
    
    if (maskedTransfer.ReceiverBvn) {
        maskedTransfer.ReceiverBvn = maskBVN(maskedTransfer.ReceiverBvn);
    }
    
    return maskedTransfer;
}

/**
 * Mask sensitive data in transaction payload
 * @param {Object} transaction - Transaction object
 * @returns {Object} Transaction with masked payload
 */
function maskTransactionPayload(transaction) {
    if (!transaction || typeof transaction !== 'object') {
        return transaction;
    }
    
    const maskedTransaction = { ...transaction };
    
    if (maskedTransaction.payload) {
        // Determine transaction type and apply appropriate masking
        if (maskedTransaction.chaincodename === 'bankloan') {
            maskedTransaction.payload = maskBankLoan(maskedTransaction.payload);
        } else if (maskedTransaction.chaincodename === 'p2ptransfer') {
            maskedTransaction.payload = maskP2PTransfer(maskedTransaction.payload);
        }
    }
    
    // Also mask write_set if present
    if (maskedTransaction.write_set && Array.isArray(maskedTransaction.write_set)) {
        maskedTransaction.write_set = maskedTransaction.write_set.map(writeSet => {
            if (writeSet.set && Array.isArray(writeSet.set)) {
                return {
                    ...writeSet,
                    set: writeSet.set.map(item => {
                        if (item.value) {
                            try {
                                const parsedValue = JSON.parse(item.value);
                                const maskedValue = writeSet.chaincode === 'bankloan' 
                                    ? maskBankLoan(parsedValue)
                                    : maskP2PTransfer(parsedValue);
                                return {
                                    ...item,
                                    value: JSON.stringify(maskedValue)
                                };
                            } catch (e) {
                                return item;
                            }
                        }
                        return item;
                    })
                };
            }
            return writeSet;
        });
    }
    
    return maskedTransaction;
}

/**
 * Mask sensitive data in an array of transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Array of transactions with masked data
 */
function maskTransactions(transactions) {
    if (!Array.isArray(transactions)) {
        return transactions;
    }
    
    return transactions.map(tx => maskTransactionPayload(tx));
}

/**
 * Mask sensitive data in block transactions
 * @param {Object} block - Block object containing transactions
 * @returns {Object} Block with masked transaction data
 */
function maskBlockTransactions(block) {
    if (!block || typeof block !== 'object') {
        return block;
    }
    
    const maskedBlock = { ...block };
    
    if (maskedBlock.transactions && Array.isArray(maskedBlock.transactions)) {
        maskedBlock.transactions = maskTransactions(maskedBlock.transactions);
    }
    
    return maskedBlock;
}

module.exports = {
    maskAccountNumber,
    maskCustomerName,
    maskBVN,
    maskBankLoan,
    maskP2PTransfer,
    maskTransactionPayload,
    maskTransactions,
    maskBlockTransactions
};
