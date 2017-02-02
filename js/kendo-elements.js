$(function() {
    $("input[kendo-date-time-picker]").kendoDateTimePicker({
        culture: "ru-RU",
        //value: new Date(),
        //format: "dd.MM.yyyy hh:mm"
        format: "dd.MM.yyyy HH:mm",
        max: new Date()
    });

    $("input[kendo-date-time-picker]").parents(".k-widget").css("width", "300px");


    //*********Костыль: установка в datepicker-ы даты******************************
   // console.log("установка дат: >>");
    var egaisStartTime = new Date(new Date().toDateString());

    $("input.start-date").val(egaisStartTime.format("dd.mm.yyyy HH:MM"));
    //console.log($("input.start-date").val());


    var seconds = egaisStartTime.getSeconds();
    var egaisEndTime = egaisStartTime;

    egaisEndTime.setSeconds(seconds + 1440 * 60 - 1);
    $("input.end-date").val(egaisEndTime.format("dd.mm.yyyy HH:MM"));
    //console.log($("input.end-date").val());
    //*******************************************************************************
});
