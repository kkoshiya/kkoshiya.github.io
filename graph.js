
let days = '';
let period = '365' //

function myFunction() {
  var test = document.getElementById("search").value;
  var coin = document.getElementById("coin").value;
  period = test;
  const str = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${coin}&tsym=USD&limit=${period}&api_key=5b30e7d4179a96d32c653107c05339a18d32c3fe4be94a384ca914fb5fc048f3`
  window.onload = main(str);
}

function formFunction() {
  var test = document.getElementById("submit-test").value;
  var period = document.getElementById("submit-test2").value;
  var variable = parseInt(document.getElementById("submit-test3").value);
  const str = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${period}&api_key=5b30e7d4179a96d32c653107c05339a18d32c3fe4be94a384ca914fb5fc048f3`

  window.onload = main(str, variable)
}




document.addEventListener("DOMContentLoaded", function () {
  function one(e) {
    period = '31';
    const str = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${period}&api_key=5b30e7d4179a96d32c653107c05339a18d32c3fe4be94a384ca914fb5fc048f3`
    window.onload = main(str);
  }

  function two(e) {
    period = '365';
    const str = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${period}&api_key=5b30e7d4179a96d32c653107c05339a18d32c3fe4be94a384ca914fb5fc048f3`
    window.onload = main(str);
  }

  function three(e) { //day
    period = '24';
    const str = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=BTC&tsym=USD&limit=${period}&api_key=5b30e7d4179a96d32c653107c05339a18d32c3fe4be94a384ca914fb5fc048f3`
    window.onload = main(str);
  }

  // mapper object to hold my functions
  var buttonMap = {
    b_one: function (event) {
      one(event.target)
    },
    b_two: function (event) {
      two(event.target)
    },
    b_three: function (event) {
      three(event.target)
    }
  }

  // Event Listener
  var container = document.querySelector('.buttonsContainer');
  var buttonClick = container && container.addEventListener('click', function (event) {
    var target = event.target;
    var handler;
    if (target.nodeName == "BUTTON" && (handler = target.getAttribute('data-handler'))) {
      buttonMap[handler](event)
    }
  });
});


const str = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=BTC&tsym=USD&limit=${period}&api_key=5b30e7d4179a96d32c653107c05339a18d32c3fe4be94a384ca914fb5fc048f3`

let main = function (str, n = 5, test="moving_average") {
  
  const http = new XMLHttpRequest();
  let priceArray = []
  let vals = []
  let prices;
  let x;
  let axiosRes = function () {
    axios.get(str)
      .then(res => {
        let priceArray = []
        let close = [];
        var myJSON = JSON.stringify(res);
        var obj = JSON.parse(myJSON);
        x = obj.data.Data.Data;
        let day = 1;
        x.forEach(ele => {
          let hold = { label: day, y: ele.close };
          priceArray.push(hold);
          close.push(ele.close)
          day += 1;
        });
        day = 1;
        let low = Math.min.apply(null, close);
        let movingAvg = movingAverage(close, n) 

        var backtesterArr = [];
        for (let i = 0; i < close.length; i++){
          backtesterArr.push([close[i], movingAvg[i]])
        }
        
        let backtesterVals = MA_backtester(backtesterArr);
        backtesterVals.forEach(el => {
          let hold = { label: day, y: el };
          vals.push(hold);
          day += 1
        })
        var chart = new CanvasJS.Chart("chartContainer", {
          animationEnabled: true,
          title: {
            text: `Bitcoin (change: ${Math.floor(priceArray[priceArray.length - 1].y - priceArray[0].y)})`
          }, 
          toolTip: {
            shared: true
          },
          axisY: {
            minimum: low-200,
          },
          legend: {
              display: true,
              position: 'bottom',
              labels: {
                fontColor: "#000080",
              }
          },
          data: [
            {
              // Change type to "doughnut", "line", "splineArea", etc.
              type: "line",
              name: "Price",
              dataPoints: priceArray
  
            },
            {
              type: 'line',
              name: "Backtester",
              dataPoints: vals
            }
          ],



        }); //end of the chart 
        chart.render();

      }
      )
  };
  axiosRes()
}



function MA_backtester(arr) { //basic backtester
  var sum = 0;
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  var avg = sum / arr.length;
  let output = [];
  let startVal = arr[0][0];
  let total = startVal;
  let position = 0;
  arr.forEach(el => {
    if (el[0] < el[1]) {
      position = el[0]
    }
    else if (el[0] > el[1] && position > 0) { //if the current value is higher than the startVal
      total += (el[0] - position); 
      position = 0 //reset the position back to zero
    } 
    output.push(total)
  })

  return output;
}


function movingAverage(arr, n = 5) {
  let output = [];
  for (let i = 0; i < n-1; i++) {
    output.push(0);
  }
  for (let i = n; i < arr.length - 1; i++) {
    let avg = 0;
    for (let j = i - n; j < i; j++){
      avg = avg + arr[j];
    };
    avg = avg/n;
    output.push(avg)
  }
  return output;
}

function BB(arr, n = 5) {
  let output= [];
  for (let i = 0; i < n - 1; i++) {
    output.push(0);
  }
  for (let i = n; i < arr.length -1; i++){
    let hold = [];
    for (let j = i - n; i < j; j++){
      hold.push(arr[j]);
    }
  }

  return output 
}




