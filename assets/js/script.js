const API_KEY = "47036603ffab3eeb62493a4dca917a1c";
const WEATHER_API_ENDPOINT = template`https://api.openweathermap.org/data/2.5/${'type'}?q=${'city'}&appid=${'api_key'}`
const WEATHER_ONE_API_ENDPOINT = template`https://api.openweathermap.org/data/2.5/onecall?lat=${'lat'}&lon=${'lon'}&appid=${'api_key'}`
const WEATHER_APP_SET_SECTIONS = {
    weather: setMainInfoSection,
    forecast: setForecastSection
}

var date;
var timestamp;
var units = "C";
var buttonSet = false;
var firstButton = true;
var citiesList = [];
const NUMBER_OF_CITY_HISTORY_ENTIRES = 5;

function getDate() {
    date = moment();
    timestamp = date.format('MM/DD/YYYY');
    console.log(timestamp);
}

function runWeatherAppFromButton(event) {
    var city = event.target.id;
    var inputEl = $("#city");
    inputEl.val(toTitleCase(city))
    $('#weather-results')[0].scrollIntoView();
    buttonSet = true;
    runWeatherApp(city);
}

function runWeatherApp(city) {
    getDate();
    if (!city) {
        var city = getCityFromInput();
        if (city == "") {
            return;
        }
    }
    var locallyCitySavedData = JSON.parse(localStorage.getItem(city))
    if (locallyCitySavedData) {
        getDataFromLocalStorage(locallyCitySavedData, city);
    } else {
        getWeatherDataViaAPI(city);
    }
}

function getCityFromInput() {
    var inputEl = $("#city");
    var city = inputEl.val().toUpperCase();
    console.log(city)
    return city;
}

function getDataFromLocalStorage(locallyCitySavedData, city) {
    var weatherData = locallyCitySavedData.weather;
    var forecastData = locallyCitySavedData.forecast;
    setMainInfoSection(weatherData)
    setForecastSection(forecastData)
    if (!buttonSet) {
        setButtonsSection(city);
    }
}

function getWeatherDataViaAPI(city) {
    ["weather", "forecast"].forEach(dataType => {
        console.log(dataType)
        getAPIData(city, dataType);
    })
}

function getAPIData(city, dataType) {
    var endPoint = WEATHER_API_ENDPOINT({ type: dataType, city: city, api_key: API_KEY })
    buttonSet = false;
    console.log(endPoint)
    fetch(endPoint)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.cod == "404") {
                window.alert("City not found!");
                $("#city").val("")
                return;
            }
            console.log(data);
            setDataToLocalStorage(data, city, dataType);
            WEATHER_APP_SET_SECTIONS[dataType](data, city);
            if (!buttonSet) {
                setButtonsSection(city);
                buttonSet = true;
            }
        });
}

function setUV(lat, lon) {
    var endPoint = WEATHER_ONE_API_ENDPOINT({ lat: lat, lon: lon, api_key: API_KEY });
    fetch(endPoint)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.cod == "404") {
                return;
            }
            $("#UV").text("UV Index (Current): " + data.current.uvi);
            console.log(data);
        });
}

function setDataToLocalStorage(data, city, label) {
    var locallyCitySavedData = JSON.parse(localStorage.getItem(city));
    if (!locallyCitySavedData) {
        locallyCitySavedData = {};
    }
    locallyCitySavedData[label] = data;
    localStorage.setItem(city, JSON.stringify(locallyCitySavedData));
}


function setMainInfoSection(data) {
    var temp = getTemp(data.main.temp);
    var windSpeed = getWindSpeed(data.wind.speed);
    var humidty = data.main.humidity + "%";
    var uvIndex = "";
    var lon = data.coord.lon;
    var lat = data.coord.lat;

    var basicInfoEl = $("#basic-info")
    basicInfoEl.html("");
    basicInfoEl.addClass("dotted-border");
    basicInfoEl.append([
        createInfoSectionRow("<h2>", { text: data.name + " (" + timestamp + ")", className: "weather-info-header" }),
        createInfoSectionRow("<p>", { text: "Temp: " + temp }),
        createInfoSectionRow("<p>", { text: "Wind: " + windSpeed }),
        createInfoSectionRow("<p>", { text: "Humidity: " + humidty }),
        createInfoSectionRow("<p>", { text: "UV Index: " + uvIndex, id: "UV" })
    ])
    setUV(lat, lon);
}

function createInfoSectionRow(el, attObj) {
    var headerRow = $("<div>", { class: "row" });
    var headerDiv = $("<div>", { class: "col-12" });
    var headerText = $(el, attObj);
    headerDiv.append(headerText);
    headerRow.append(headerDiv);
    return headerRow;
}

function setForecastSection(data) {
    var forecastSectionEl = $("#five-days-forecast");
    forecastSectionEl.html("");
    var forecastTitleEl = $("<h2>", { text: "5-Day Forecast:" });
    var forecastCardsContainer = $("<div>", { id: "forecast-cards-container" });
    var cardsDivsArr = []
    var addedDates = [];
    data.list.forEach(forecastObj => {
        var date = moment(forecastObj.dt_txt, "YYYY-MM-DD HH:mm:ss").format('MM/DD/YYYY');
        if (addedDates.includes(date) || date == timestamp) {
            return;
        }
        var cardDiv = createCardDiv(forecastObj, date);
        addedDates.push(date);
        cardsDivsArr.push(cardDiv);
    })
    forecastCardsContainer.append(cardsDivsArr);
    forecastSectionEl.append([forecastTitleEl, forecastCardsContainer]);

}

function createCardDiv(forecastObj, date) {
    var majorCardDiv = $("<div>", { class: "forecast-card" });
    var cardDiv = $("<div>", { class: "container" });
    var iconurl = "http://openweathermap.org/img/w/" + forecastObj.weather[0].icon + ".png";
    var temp = getTemp(forecastObj.main.temp);
    var windSpeed = getWindSpeed(forecastObj.wind.speed);
    var humidity = forecastObj.main.humidity + "%"
    cardDiv.append([
        createInfoSectionRow("<h6>", { text: date, class: "card-date" }),
        createInfoSectionRow("<img>", { src: iconurl }),
        createInfoSectionRow("<p>", { text: "Temp: " + temp }),
        createInfoSectionRow("<p>", { text: "Wind: " + windSpeed }),
        createInfoSectionRow("<p>", { text: "Humidity: " + humidity }),
    ])
    majorCardDiv.append(cardDiv);
    return majorCardDiv;
}

function setButtonsSection(city) {
    console.log(city)
    if(citiesList.includes(city)){
        return;
    }
    var idsArr = ["#main-buttons-list", "#sec-buttons-list"]
    idsArr.forEach(listId => {
        var listEl = $(listId);
        if (firstButton) {
            var borderToButton = $("<div>", { class: "border-to-button" })
            listEl.before(borderToButton);
        }
        console.log(citiesList.length);
        console.log(citiesList.length > NUMBER_OF_CITY_HISTORY_ENTIRES);
        if (citiesList.length > NUMBER_OF_CITY_HISTORY_ENTIRES) {
            console.log($(listId + " li:last-child"))
            $(listId + " li:last-child").remove();
        }
        var newliEl = $("<li>");
        var newButtonEl = $("<button>", { text: city, id: city, class: "aside-button recall-city-button", on: { click: runWeatherAppFromButton } });
        newliEl.append(newButtonEl);
        listEl.prepend(newliEl);
    })
    citiesList.push(city);
    firstButton = false;
}

function setUnits(element) {
    var unit = element.id;
    $("#" + unit).addClass("toggle-active");
    $("#" + units).removeClass("toggle-active")
    units = unit;
    var city = getCityFromInput();
    buttonSet = true;
    runWeatherApp(city);
    $('#weather-results')[0].scrollIntoView();
}
function getTemp(temp) {
    if (units == "C") {
        return (parseFloat(temp) - 273.15).toFixed(2) + "°C";
    } else {
        return (((parseFloat(temp) - 273.15) * (9 / 5)) + 32).toFixed(2) + "°F";
    }
}

function getWindSpeed(windSpeed) {
    if (units == "C") {
        return windSpeed + " m/s";
    } else {
        return (parseFloat(windSpeed) * 2.237).toFixed(2) + " MPH";
    }
}

function template(strings, ...keys) {
    return (function (...values) {
        let dict = values[values.length - 1] || {};
        let result = [strings[0]];
        keys.forEach(function (key, i) {
            let value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join('');
    });
}

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}