var Navicon = Navicon || {};

Navicon = {
    formTypeEnum: Object.freeze({
        "Undefined": 0,
        "Create": 1,
        "Update": 2,
        "Read Only": 3,
        "Disabled": 4,
        "Bulk Edit": 6
    })
}

Navicon.nav_communication = (function () {
    /*
    На форме объекта Средство связи, при создании поля Телефон и Email скрыты.
    При выборе пользователем значения в поле Тип, необходимо отображать соответствующее поле:
    Если тип = Телефон, отображать поле Телефон
    Если тип = E-mail, отображать поле Email.
    */
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
            try {
                if (formContext.ui.getFormType() === Navicon.formTypeEnum.Create) {
                    formContext.getControl('nav_phone').setVisible(false);
                    formContext.getControl('nav_email').setVisible(false);
                }
                formContext.getAttribute('nav_type').addOnChange(TypeOnChange);
            } catch (e) {
                formContext.ui.setFormNotification("Ошибка, возможно отсустствует поле. " + e.message, "ERROR", "ER-WRNG-AGRM-DAT");
            }
        }

    }
})();