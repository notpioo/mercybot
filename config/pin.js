// PIN Configuration for Owner Access
module.exports = {
    ownerPin: 'Faratama', // Default PIN, can be changed by owner
    
    // Function to update PIN
    updatePin: function(newPin) {
        this.ownerPin = newPin;
        console.log('🔐 Owner PIN updated successfully');
    },
    
    // Function to verify PIN
    verifyPin: function(inputPin) {
        return this.ownerPin === inputPin;
    },
    
    // Function to get current PIN (for owner reference only)
    getCurrentPin: function() {
        return this.ownerPin;
    }
};