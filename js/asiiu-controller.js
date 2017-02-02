var askpApp = angular.module("askpApp", ['uiGmapgoogle-maps', 'kendo.directives']);

//AngularJS Date Filter with /Date(############) json format
askpApp.filter("mydate", function () {
    return function (x) {
        try {
            return new Date(parseInt(x.substr(6)));
        } catch (e) {
            //console.log("Error(filter mydate):" + e);
            return "";
        }
    };
});

var controller = askpApp.controller("AsiiuController", ['$scope', '$http', '$timeout', '$sce', function ($scope, $http, $timeout, $sce) {

    $scope.DurationEnum = {
        Day: 0,
        Week: 1,
        Month: 2,
        All: 3
    }

    /**********************************************************************Fields**************************************************************************/

    $scope.Organisations = [];
    $scope.SelectedOrganisationName = "";

    $scope.SelectedFactory = [];
    $scope.CurrentBox = [];
    $scope.CurrentLine = [];

    //*********** Data Arrays ***************************/
    $scope.CurrentLineEgaisReport = [];
    $scope.CurrentLineFlkArray = [];


    //*********** Date duration fields*******************/
    $scope.LogsStartDate = [];
    $scope.LogsEndDate = [];

    $scope.FlkStartDate = [];
    $scope.FlkEndDate = [];

    $scope.EgaisStartDate = [];
    $scope.EgaisEndDate = [];

    // Create map (navigation)
    $scope.map = { center: { latitude: 55.755826, longitude: 37.6173 }, zoom: 8 };
    $scope.map.options = { scrollwheel: true };

    //*********** Month Week Day durations style********/
    $scope.LogsMonthWeekDaySelectedDuration = ["", "", "block_calendar_active"];
    $scope.FlkMonthWeekDaySelectedDuration = ["", "", "", "block_calendar_active"];
    $scope.EgaisMonthWeekDaySelectedDuration = ["", "", "", "block_calendar_active"];

    //***Picker Options*****************************************************************************/

    $scope.DatePickerOptions = {
        format: "dd/MM/yyyy HH:mm", // Selected date & time format
        timeFormat: "HH:mm"         // time format in dropdown list
    }
    $scope.Version = "2.0";

    //***************************************************Определяем тек.контроллер и страницу(действие)****************************************************/

    var url = window.location.pathname.split("/");
    $scope.urlController = url[1];
    $scope.urlAction = url[2];


    //***Google Maps*****************************************************************************/
    $scope.markers = []; // map markers

    $scope.iconDefaultUrl = "/Content/MapMarkers/free-map-marker-icon-blue.png"; // blue marker

    angular.element('.angular-google-map-container').css('height', '120px');
    angular.element('.map').css('height', '120px');

    angular.element('.angular-google-map-container').css('width', '100%');
    angular.element('.map').css('width', '100%');

    angular.element('.angular-google-map-container').css('margin', '0');
    angular.element('.angular-google-map-container').css('padding', '0');

    // Add markers to map
    $scope.AddFactotyMarkersToMap = function () {
        var i = 0;
        angular.forEach($scope.Organisations, (function (organisation, key) {
            angular.forEach(organisation.Factories, (function (factory, subKey) {
                i++;
                $scope.markers.push($scope.createMarker(factory, i));
            }));
        }));
    }

    // Create marker
    $scope.createMarker = function (factory, index) {
        var titleText = "";
        titleText += "Организация: " + factory.Name + "\n";
        var marker = {
            id: factory.Id,
            latitude: factory.Latitude,
            longitude: factory.Longitude,
            isSelected: false,
            show: false,
            options: {
                title: titleText,
                icon: {
                    url: $scope.iconDefaultUrl,
                    scaledSize: new google.maps.Size(55, 55)
                },
                labelClass: 'marker_labels',
                labelAnchor: '5 43',
                labelContent: index
            },
            //gpsPointInfo: gpsPoint
        };
        return marker;
    };

    /**********************************************************************HTTP GET ACTIONS***************************************************************/

    $http.get("/Asiiu/Get").success(function (organisationsDataResponse) {
        if (organisationsDataResponse != null) {
            $scope.Organisations = organisationsDataResponse || organisationsDataResponse.data;
            console.log("Данные по организациям загружены -->");
            $scope.OnLeftMenuBoxClicked($scope.Organisations[0].Name, $scope.Organisations[0].Factories[0], $scope.Organisations[0].Factories[0].Boxes[0]);
            $scope.OnInContentBoxClicked($scope.Organisations[0].Factories[0], $scope.Organisations[0].Factories[0].Boxes[0]);
            $scope.UpdateCurrentBoxLines();
            $scope.AddFactotyMarkersToMap();

        };
    });

    ///********************************************************************OnClick Events****************************************************************/
    $scope.OnLeftMenuBoxClicked = function (organisationName, factory, box) {

        $scope.SelectedOrganisationName = organisationName;
        $scope.SelectedFactory = factory;
        $scope.CurrentBox = box;

        $scope.ClearSelectionsFromAllBoxes();
        box.IsSelected = true;

        $scope.UpdateCurrentBoxLines();
        $scope.UpdateCurrentBoxDevices();

        if ($scope.CurrentBox.Lines[0] !== null)
            $scope.OnBoxLineClicked($scope.CurrentBox.Lines[0]);
        else {
            console.log("$scope.CurrentLineFlkArray = [];");
            $scope.CurrentLineFlkArray = [];
        }

        $scope.GetBoxLogs($scope.DurationEnum.Day);

        $scope.map.center = {
            latitude: factory.Latitude,
            longitude: factory.Longitude
        };

    }
    $scope.OnInContentBoxClicked = function (factory, box) {

        $scope.SelectedFactory = factory;
        $scope.CurrentBox = box;

        $scope.ClearSelectionsFromAllBoxesInSelectedFactory();
        box.IsSelected = true;
    }
    $scope.OnBoxLineClicked = function (line) {
        $scope.CurrentLine = line;
        $scope.GetLineAllFlk($scope.DurationEnum.All);
        $scope.GetLineEgaisReport($scope.DurationEnum.Month);
    }
    ///********************************************************************Style OnEvents****************************************************************/
    $scope.SetLeftMenuBoxSelectedStyle = function (value) {
        if (value === true) {
            return "sub_sub_active";
        }
        return " ";
    }
    $scope.SetInContentBoxSelectedStyle = function (value) {
        //console.log("SetInContentBoxSelectedStyle");
        if (value === true) {
            return "case_active";
        }
        return " ";
    }
    $scope.ClearSelectionsFromAllBoxes = function () {
        angular.forEach($scope.Organisations, (function (organisation, key) {
            angular.forEach(organisation.Factories, (function (factory, subKey) {
                angular.forEach(factory.Boxes, (function (box, subSubKey) {
                    box.IsSelected = false;
                }));
            }));
        }));
    }
    $scope.ClearSelectionsFromAllBoxesInSelectedFactory = function () {
        angular.forEach($scope.SelectedFactory.Boxes, (function (box, subSubKey) {
            box.IsSelected = false;
        }));
    }
    $scope.DeviceStatusText = function (isError) {
        if (isError)
            return "Нет связи";
        else {
            return "Подключен";
        }

        return "";
    }
    $scope.ErrorRowBackground = function (isError) {
        if (isError)
            return "block1_error_row";

        return "block1_green_row";
    }
    $scope.LogsTypeRowStyle = function (type) {
        if (type === 2)
            return "block1_error_row";

        if (type === 1)
            return "block1_warning_row";

        if (type === 0)
            return "block1_green_row";

        return "";
    }
    $scope.ErrorRowText = function (isError) {
        if (isError)
            return "error_row_div";

        return "block1_green_row";
    }
    // Box status events icons in left menu
    $scope.SetLeftMenuBoxIcons = function (box)
    {
        var icons = "";

        if (box.IsWork) {
                icons += '<img src="/Content/css/ic_play.png" title="' + 'Идет производство на линиях' + '">';
        }
        else {
                icons += '<img src="/Content/css/ic_stop_gray.png" title="' + 'Нет активных линий' + '">';
        }

        if (box.IsDeviceErrors) {
                icons += '<img src="/Content/css/ic_error_device.png" title="' + 'Имеются неисправности в устройствах' + '">';
        }

        if (box.IsFlkErrors) {
                icons += '<img src="/Content/css/ic3.png" title="' + 'Имеются ошибки ФЛК в суточных данных' + '">';
        }

         if (box.IsOnline) {
                icons += '<img src="/Content/css/ic_connect.png" title="' + 'Онлайн' + '">';
        }
        else {
                icons += '<img src="/Content/css/ic1.png" title="' + 'Оффлайн' + '">';
        }
        return $sce.trustAsHtml(icons);
    }
    // Box is not online event icon in content page
    $scope.SetBoxIconsInContent = function (isOnline) {
        if (!isOnline)
            return "ic_noconnect";

        return "";
    }
    $scope.FlkInfoTitle = function (value) {
        if (value > 0)
            return "Имеется " + value +  " ошибок";

        return "Ошибки отсутствуют";
    }
    $scope.EgaisInfoTitle = function (value) {

        var count = 0;
        angular.forEach(value, (function (product, key) {
            count += product.Report.length;
        }));

        if (count > 0)
            return "Имеется " + count + " событий";

        return "События отсутствуют";
    }
    $scope.FlkErrorIcon = function (value) {
        if (value > 0)
            return "block1_error";

        return "";
    }
    // TODO LinesErrorsIcon - НАДО СДЕЛАТЬ нормально
    $scope.LinesErrorsIcon = function (hasErrors) {
        if (hasErrors)
            return "block1_error";

        return "";
    }
    $scope.CountOfErrorDevices = function (devices) {
        var count = 0;
        angular.forEach(devices, (function (device, key) {
            if (device.IsError)
                count++;
        }));

        return count;
    }
    $scope.BlockTitleErrorIcon = function (value) {
        if (value > 0)
            return "block1_error";

        return "";
    }
    $scope.DevicesInfoTitle = function (value) {
        if (value > 0)
            return "Имеется " + value + " проблемных устройств";

        return "ОК";
    }

    $scope.SetLogsSelectedDurationsLinkStyle = function (value) {

        try {
            for (var i = 0; i < $scope.LogsMonthWeekDaySelectedDuration.length; i++)
                $scope.LogsMonthWeekDaySelectedDuration[i] = "";
            $scope.LogsMonthWeekDaySelectedDuration[value] = "block_calendar_active";

            if (value == $scope.DurationEnum.Day) $scope.SelectedDurationText = "Данные за сутки";
            if (value == $scope.DurationEnum.Week) $scope.SelectedDurationText = "Данные за неделю";
            if (value == $scope.DurationEnum.Month) $scope.SelectedDurationText = "Данные за месяц";

        } catch (e) {
            console.log(e);
        }
    }
    $scope.SetFlkSelectedDurationsLinkStyle = function (value) {

        try {
            for (var i = 0; i < $scope.FlkMonthWeekDaySelectedDuration.length; i++)
                $scope.FlkMonthWeekDaySelectedDuration[i] = "";
            $scope.FlkMonthWeekDaySelectedDuration[value] = "block_calendar_active";

            if (value == $scope.DurationEnum.Day) $scope.FlkDurationText = "Данные за сутки";
            if (value == $scope.DurationEnum.Week) $scope.FlkDurationText = "Данные за неделю";
            if (value == $scope.DurationEnum.Month) $scope.FlkDurationText = "Данные за месяц";
            if (value == $scope.DurationEnum.All) $scope.FlkDurationText = "Весь период";

        } catch (e) {
            console.log(e);
        }
    }
    $scope.SetEgaisSelectedDurationsLinkStyle = function (value) {

        try {
            for (var i = 0; i < $scope.EgaisMonthWeekDaySelectedDuration.length; i++)
                $scope.EgaisMonthWeekDaySelectedDuration[i] = "";
            $scope.EgaisMonthWeekDaySelectedDuration[value] = "block_calendar_active";
            if (value == $scope.DurationEnum.Day) $scope.EgaisDurationText = "Данные за сутки";
            if (value == $scope.DurationEnum.Week) $scope.EgaisDurationText = "Данные за неделю";
            if (value == $scope.DurationEnum.Month) $scope.EgaisDurationText = "Данные за месяц";
        } catch (e) {
            console.log(e);
        }
    }

    //***************************************************************Start data update timer*************************************************************/

    //Запускаем обновление данных
    $scope.TimerInterval = 60;
    console.log("Инициализация таймера обновления данных(интервал " + $scope.TimerInterval + " сек)");
    $scope.timerUpdateData = setTimeout(function updateData() {

        // Обновляем все что нужно
        $scope.UpdateCurrentBoxLines();
        $scope.UpdateCurrentBoxDevices();

        console.log("--> Данные обновлены");
        $scope.timerUpdateData = setTimeout(updateData, $scope.TimerInterval*1000);
    }, 60000);


    //*********** Grid title fields**********************/
    $scope.SetLogsSelectedDurationsLinkStyle($scope.DurationEnum.Day);
    $scope.SetEgaisSelectedDurationsLinkStyle($scope.DurationEnum.Week);
    $scope.SetFlkSelectedDurationsLinkStyle($scope.DurationEnum.All);

    ///******************************************************************Update data actions*************************************************************/
    $scope.UpdateCurrentBoxLines = function () {
        if ($scope.CurrentBox !== null) {
            $http.get("/Asiiu/UpdateLines", { params: { Id: $scope.CurrentBox.Id } }).success(function (linesData) {
                $scope.CurrentBox.Lines = linesData || linesData.data;
            });
        }
    }
    $scope.UpdateCurrentBoxDevices = function () {
        if ($scope.CurrentBox !== null) {
            $http.get("/Asiiu/UpdateDevices", { params: { Id: $scope.CurrentBox.Id } }).success(function (devicesData) {
                $scope.CurrentBox.Devices = devicesData || devicesData.data;
            });
        }
    }

    ///***********************************************************************Box Logs*******************************************************************/
    // Logs type: 0 - Info; 1 - Warning; 3 - Error
    $scope.GetBoxLogs = function (duration) {
        if ($scope.CurrentBox !== null) {
            $http.get("/Asiiu/GetBoxLogs", { params: { id: $scope.CurrentBox.Id, duration: duration } }).success(function (boxLogsData) {
                $scope.CurrentBox.Logs = boxLogsData || boxLogsData.data;
                $scope.LogsStartDate =$scope.CurrentBox.Logs.start;
                $scope.LogsEndDate =$scope.CurrentBox.Logs.end;
            });
        } else {
            $scope.CurrentBox.Logs = [];
        }
        $scope.SetLogsSelectedDurationsLinkStyle(duration);
    }
    $scope.GetBoxLogsCustomDuration = function (startDate, endDate) {
        //console.log("Update Logs of: ");
        //console.log($scope.CurrentBox);
        console.log("GetBoxLogsCustomDuration, start: " + startDate + " endDate:" + endDate);
        if ($scope.CurrentBox !== null) {
            $http.get("/Asiiu/GetBoxLogsCustomDuration", { params: { Id: $scope.CurrentBox.Id, startDate: startDate, endDate: endDate } }).success(function (boxLogsData) {
                $scope.CurrentBox.Logs = boxLogsData || boxLogsData.data;
                $scope.SelectedDurationText = "Данные за период с " +startDate + " по " +endDate;
                $scope.LogsStartDate =$scope.CurrentBox.Logs.start;
                $scope.LogsEndDate =$scope.CurrentBox.Logs.end;
                //console.log("New data of Logs: ");
                //console.log(Logs);
            });
        } else {
            $scope.CurrentBox.Logs = [];
        }
    }

    ///*******************************************************************Line Flk Actions**************************************************************/
    $scope.GetLineAllFlk = function (duration) {
        try {
            //console.log("Update Flk of Line: ");
            //console.log($scope.CurrentLine);

            if ($scope.CurrentLine !== null) {
                $http.get("/Asiiu/GetLineAllFlk", { params: { Id: $scope.CurrentLine.Id} }).success(function (lineFlkData) {
                    $scope.CurrentLineFlkArray = lineFlkData || lineFlkData.data;
                });
            } else {
                $scope.CurrentLineFlkArray = [];
            }

        } catch (e) {
            //console.log(e);
            $scope.CurrentLineFlkArray = [];
            $scope.FlkDurationText = "Возникла ошибка";
        }
        $scope.SetFlkSelectedDurationsLinkStyle(duration);
    }
    $scope.GetLineFlk = function (duration) {
        try {
            //console.log("Update Flk of Line: ");
            //console.log($scope.CurrentLine);
            if ($scope.CurrentLine !== null) {
                $http.get("/Asiiu/GetLineFlk", { params: { Id: $scope.CurrentLine.Id, duration: duration } }).success(function (lineFlkData) {
                    $scope.CurrentLineFlkArray = lineFlkData || lineFlkData.data;
                    $scope.FlkStartDate =$scope.CurrentLineFlkArray.start;
                    $scope.FlkEndDate =$scope.CurrentLineFlkArray.end;
                    //console.log("New Flk data of Line: ");
                    //console.log(lineFlkData);
                });
            } else {
                $scope.CurrentLineFlkArray = [];
            }

        } catch (e) {
            //console.log(e);
            $scope.CurrentLineFlkArray = [];
        }
        $scope.SetFlkSelectedDurationsLinkStyle(duration);
    }
    $scope.GetLineFlkCustomDuration = function (startDateFlk, endDateFlk) {
        try {
            //console.log("Update Flk of Line, start: " + startDateFlk + " endDate:" + endDateFlk);
            //console.log($scope.CurrentLine);
            if ($scope.CurrentLine !== null) {
                $http.get("/Asiiu/GetLineFlkCustomDuration", { params: { Id: $scope.CurrentLine.Id, startDate: startDateFlk, endDate: endDateFlk } }).success(function (lineFlkData) {
                    $scope.CurrentLineFlkArray = lineFlkData || lineFlkData.data;
                    $scope.FlkDurationText = "Период с " + startDateFlk + " по " + endDateFlk + " ";
                    $scope.FlkStartDate =$scope.CurrentLineFlkArray.start;
                    $scope.FlkEndDate =$scope.CurrentLineFlkArray.end;
                    //console.log("New Flk data of Line: ");
                    //console.log(lineFlkData);
                });
            } else {
                $scope.CurrentLineFlkArray = [];
            }

        } catch (e) {
            //console.log(e);
            $scope.CurrentLineFlkArray = [];
        }
    }

    ///******************************************************************Line Egais Report**************************************************************/

    $scope.GetLineEgaisReport = function (duration) {
        try {
            if ($scope.CurrentLine !== null) {
                $http.get("/Asiiu/GetLineEgaisReport", { params: { Id: $scope.CurrentLine.Id, duration: duration } }).success(function (lineEgaisReportData) {
                    $scope.CurrentLineEgaisReport = lineEgaisReportData || lineEgaisReportData.data;
                    $scope.EgaisStartDate = $scope.CurrentLineEgaisReport.start;
                    $scope.EgaisEndDate =$scope.CurrentLineEgaisReport.end;
                });
            } else {
                $scope.CurrentLineEgaisReport = [];
            }
        } catch (e) {
            console.log(e);
            $scope.CurrentLineEgaisReport = [];
        }
        $scope.SetEgaisSelectedDurationsLinkStyle(duration);
    }
    $scope.GetLineEgaisReportCustomDuration = function (startDateEgais, endDateEgais) {
        try {
            if ($scope.CurrentLine !== null) {
                $http.get("/Asiiu/GetLineEgaisReportCustomDuration", { params: { Id: $scope.CurrentLine.Id, startDate: startDateEgais, endDate: endDateEgais } }).success(function (lineEgaisReportData) {
                    $scope.CurrentLineEgaisReport = lineEgaisReportData || lineEgaisReportData.data;
                    $scope.EgaisDurationText = "Период с " + startDateEgais + " по " +endDateEgais + " ";
                    $scope.EgaisStartDate = $scope.CurrentLineEgaisReport.start;
                    $scope.EgaisEndDate =$scope.CurrentLineEgaisReport.end;
                });
            } else {
                $scope.CurrentLineEgaisReport = [];
            }
        } catch (e) {
            console.log(e);
            $scope.CurrentLineEgaisReport = [];
        }
    }
}]);
