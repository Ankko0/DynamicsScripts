var Navicon = Navicon || {};

Navicon.nav_communication = (function () {
    function TypeOnChange(context) {
        let formContext = context.getFormContext();
        let typeText = formContext.getAttribute('nav_type').getText();
        if (typeText === "Телефон") {
            formContext.getControl('nav_phone').setVisible(true);
            formContext.getControl('nav_email').setVisible(false);
        } else if (typeText === "E-mail") {
            formContext.getControl('nav_email').setVisible(true);
            formContext.getControl('nav_phone').setVisible(false);
        } else {
            formContext.getControl('nav_phone').setVisible(false);
            formContext.getControl('nav_email').setVisible(false);
        }
    }

    return {
        OnLoad: function (context) {
            let formContext = context.getFormContext();
            formContext.getControl('nav_phone').setVisible(false);
            formContext.getControl('nav_email').setVisible(false);
            formContext.getAttribute('nav_type').addOnChange(TypeOnChange);
        }

    }
})();