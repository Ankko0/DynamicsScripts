// JavaScript source code
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

Navicon.nav_agreement = (function () {

    /*
    * На объекте Договор, после выбора значения в полях контакт и автомобиль, становиться доступной вкладка кредитная программа.
    */
    var ContactOnChange = function (context) {
        let formContext = context.getFormContext();
        try {
            let contactAttr = formContext.getAttribute('nav_contactid');
            let autoAttr = formContext.getAttribute('nav_autoid');
            if (contactAttr.getValue() !== null && autoAttr.getValue() !== null) {
                formContext.getControl('nav_creditid').setVisible(true);
            } else {
                formContext.getControl('nav_creditid').setVisible(false);
            }
        } catch (e) {
            formContext.ui.setFormNotification("Ошибка, отсустствует поле. " + e.message, "ERROR", "ER-WRNG-AGRM-DAT");
        }
    }

    /*
    * На объекте Договор, после выбора кредитной программы, становятся доступными для редактирования поля, связанные с расчетом кредита.
    * Объект Договор: после выбора значения в поле кредитная программа, срок кредита должен подставляться из выбранной кредитной программы в договор.
    */
    var CreditidOnChange = function (context) {
        let formContext = context.getFormContext();
        try {
            let creditAttr = formContext.getAttribute('nav_creditid');
            if (creditAttr.getValue() !== null)
                Xrm.Page.ui.tabs.get("nav_detailstab").sections.get("nav_creditsection").setVisible(true);

            Xrm.WebApi.retrieveRecord("nav_credit", creditAttr.getValue()[0].id, "?$select=nav_creditperiod")
                .then(function (creditResult) {
                    formContext.getAttribute('nav_creditperiod').setValue(creditResult.nav_creditperiod);
                })
        } catch (e) {
            formContext.ui.setFormNotification("Ошибка, отсустствует поле. " + e.message, "ERROR", "ER-WRNG-AGRM-DAT");
        }
    }

    /*
    На объекте Договор, реализовать функцию для поля номер договора - по завершении ввода, оставлять только цифры и тире.
    */
    var NameOnChange = function (context) {
        let formContext = context.getFormContext();
        try {
            let nameAttr = formContext.getAttribute('nav_name');
            const regExp = /[^0-9-]+/g;
            nameAttr.setValue(nameAttr.getValue().replace(regExp, ''));
        } catch (e) {
            formContext.ui.setFormNotification("Ошибка, отсустствует поле. " + e.message, "ERROR", "ER-WRNG-AGRM-DAT");
        }
    }

    /*
    При выборе объекта Автомобиль в объекте Договор, стоимость должна подставляться Автоматически в соответствии с правилом:
    ● Если автомобиль с пробегом, стоимость берется из поля Сумма на объекте Автомобиль
    ● Если автомобиль без пробега, стоимость берется из поля сумма объекта
    Модель, указанной на Автомобиле.
    */
    function AutoOnChange(context) {
        ContactOnChange(context);
        let formContext = context.getFormContext();
        if (formContext.getAttribute("nav_autoid").getValue() == null)
            return;
        Xrm.WebApi.retrieveRecord("nav_auto", formContext.getAttribute("nav_autoid").getValue()[0].id, "?$select=nav_used,nav_amount, nav_modelid")
            .then(function (autoResult) {
                if (autoResult.nav_used) {
                    formContext.getAttribute('nav_summa').setValue(autoResult.nav_amount);
                } else {
                    Xrm.WebApi.retrieveRecord("nav_model", autoResult.nav_modelid, "?$select=nav_recommendedamount")
                        .then((modelresult) => {
                            formContext.getAttribute('nav_summa').setValue(modelresult.nav_recommendedamount);
                        });
                }
            });
    }

    return {

        /*
        * При создании объекта Договор, сразу после открытия карточки доступны для редактирования поля: номер, дата договора, контакт и модель.
        * Остальные поля - скрыты. Вкладка с данными по кредиту скрыта.
        */
        onLoad: function (context) {
            let formContext = context.getFormContext();
            try {
                formContext.getAttribute('nav_contactid').addOnChange(ContactOnChange);
                formContext.getAttribute('nav_autoid').addOnChange(AutoOnChange);
                formContext.getAttribute('nav_creditid').addOnChange(CreditidOnChange);
                formContext.getAttribute('nav_name').addOnChange(NameOnChange);
            } catch (e) {
                formContext.ui.setFormNotification("Ошибка, отсустствует поле. " + e.message, "ERROR", "ER-WRNG-AGRM-DAT");
            }

            if (formContext.ui.getFormType() === Navicon.formTypeEnum.Create) {
                formContext.getControl('nav_creditid').setVisible(false);
                Xrm.Page.ui.tabs.get("nav_detailstab").sections.get("nav_creditsection").setVisible(false);
            }
        },

        /* Проверка срока действия кредитной программы (должен быть больше года) и соответствие даты договра и дат кредитной программы. */
        OnSave: function (context) {
            let formContext = context.getFormContext();
            let dateAttr = formContext.getAttribute('nav_date');
            let creditAttr = formContext.getAttribute("nav_creditid");
            if (creditAttr !== null && creditAttr.getValue() !== null && dateAttr !== null && dateAttr.getValue() !== null)
                Xrm.WebApi.retrieveRecord("nav_credit", creditAttr.getValue()[0].id, "?$select=nav_datestart,nav_dateend")
                    .then(function (creditResult) {
                            console.log("Date Start:" + creditResult.nav_datestart + " Date End:" + creditResult.nav_dateend);
                            var creditDateStart = moment(creditResult.nav_datestart);
                            var creditDateEnd = moment(creditResult.nav_dateend);
                            var agreemDate = moment(dateAttr.getValue());
                            if (creditDateStart.add(1, 'years').isAfter(creditDateEnd)) {
                                var saveEvent = context.getEventArgs();
                                formContext.ui.setFormNotification("Срок действия кредитного договора меньше одного года", "ERROR", "ER-WRNG-CRDT-DAT");
                                /* НЕ РАБОТАЕТ !*/
                                saveEvent.preventDefault();
                            }
                            /* НАДО ФИКСИТЬ */
                            else if (agreemDate.isAfter(creditDateEnd) || agreemDate.isBefore(creditDateStart)) {
                                var saveEvent = context.getEventArgs();
                                formContext.ui.setFormNotification("Срок действия кредитного договора не соответствует дате договора.", "ERROR", "ER-WRNG-AGRM-DAT");
                                /* НЕ РАБОТАЕТ !*/
                                saveEvent.preventDefault();
                            } else {
                                formContext.ui.clearFormNotification("ER-WRNG-CRDT-DAT");
                                formContext.ui.clearFormNotification("ER-WRNG-AGRM-DAT");
                            }
                        }
                    );
        },

        /*
        * На карточку объекта Договор поместить кнопку «Пересчитать кредит». При нажатии на кнопку
        * ● Пересчитывать поле сумма кредита.
        * Сумма кредита = [Договор].[Сумма] – [Договор].[Первоначальный взнос]
        * ● Пересчитать поле полная стоимость кредита
        * полная стоимость кредита = ([Кредитная Программа].[Ставка]/100 *[Договор].[Срок кредита] * [Договор].[ Сумма кредита] ) + [Договор].[ Сумма кредита]
        */
        CreditRecount: function () {
            let formContext = context.getFormContext();
            try {
                if (formContext.getAttribute('nav_creditid').getValue() == null) {
                    formContext.ui.setFormNotification("Кредит не выбран", "ERROR", "ER-CRD-NT-SLCTD");
                    return;
                }
                formContext.ui.clearFormNotification("ER-CRD-NT-SLCTD");

                let creditAmountAttr = formContext.getAttribute("nav_creditamount");
                let summaAttr = formContext.getAttribute('nav_summa');
                let initialfeeAttr = formContext.getAttribute('nav_initialfee')
                let agrmntAmount = parseFloat(summaAttr.getValue()) || 0;
                let creditInitialAmount = parseFloat(initialfeeAttr.getValue()) || 0;
                if (agrmntAmount !== null && creditInitialAmount !== null)
                    creditAmountAttr.setValue(agrmntAmount - creditInitialAmount);

                let fullCreditAmountAttr = formContext.getAttribute("nav_fullcreditamount");
                let creditPeriod = parseFloat(formContext.getAttribute("nav_creditperiod").getValue()) || 0;
                let creditAmount = parseFloat(formContext.getAttribute("nav_creditamount").getValue()) || 0;
                if (creditPeriod !== null && creditAmount !== null)
                    Xrm.WebApi.retrieveRecord("nav_credit", formContext.getAttribute("nav_creditid").getValue()[0].id, "?$select=nav_percent")
                        .then(function (creditResult) {
                            let creditFee = (parseFloat(creditResult.nav_percent) || 0) / 100 * creditPeriod * creditAmount;
                            let finalAmount = creditFee + creditAmount;
                            fullCreditAmountAttr.setValue(finalAmount);
                        })
            } catch (e) {
                formContext.ui.setFormNotification("Произошла ошибка" + e.message, "ERROR", "ER-CRD-NT-SLCTD");
                console.log(e.message);
            }
        }
    }
})
();
