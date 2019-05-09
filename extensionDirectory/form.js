
passwordOnBlur( 'inputSocialSecurity' );

/**
 * Proof of concept to potentially use checkboxes
 * to determine what document tabs to open.
 */
var generateDocumentsBtn = document.getElementById( 'generateDocuments' );
generateDocumentsBtn.addEventListener('click', function() {
    chrome.tabs.create({url: 'https://www.google.com', active: false});
    chrome.tabs.create({url: 'https://github.com/codeforbtv/', active: false});
    chrome.tabs.create({url: 'https://www.facebook.com', active: false});
});

/**
 * Allows an input field to toggle data display between two states:
 *  - Password (obfuscated) field when not focused.
 *  - Text (readable) input field when focused.
 * 
 * @param {string} inputFieldID The ID of the input field.
 * @return {void}
 */
function passwordOnBlur( inputFieldID ) {
    var inputToSecure = document.getElementById( inputFieldID );

    inputToSecure.addEventListener('focus', function() {
        var field_type = this.getAttribute('type');
        if( 'password' === field_type ) {
            this.setAttribute( 'type', 'text' )
        }
    });
    inputToSecure.addEventListener('blur', function() {
        var field_type = this.getAttribute('type');
        if( 'password' !== field_type ) {
            this.setAttribute( 'type', 'password' )
        }
    });
}
