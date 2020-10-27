let globalData;
const allTableHeaders = document.querySelectorAll('.main-table-header');

async function getSummary() {
	const res = await fetch('https://api.covid19api.com/summary');
	const data = await res.json();
	globalData = data;
	const global = data.Global;
	const newConfirmedLabel = document.querySelector('span.new-confirmed-count');
	const newDeathsLabel = document.querySelector('span.new-deaths-count');
	const newRecoveredLabel = document.querySelector('span.new-recovered-count');
	const totalConfirmedLabel = document.querySelector('span.total-confirmed-count');
	const totalDeathsLabel = document.querySelector('span.total-deaths-count');
	const totalRecoveredLabel = document.querySelector('span.total-recovered-count');
	newConfirmedLabel.innerText = global.NewConfirmed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	newDeathsLabel.innerText = global.NewDeaths.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	newRecoveredLabel.innerText = global.NewRecovered.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	totalConfirmedLabel.innerText = global.TotalConfirmed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	totalDeathsLabel.innerText = global.TotalDeaths.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	totalRecoveredLabel.innerText = global.TotalRecovered.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	renderMainTable(data.Countries);
}

async function renderMainTable(data) {
	const chart = document.querySelector('.chart');
	if (chart !== null) {
		chart.remove();
	}
	const removeTableLeaveHeaders = document.querySelectorAll('#main-table-section>div>div:not(:first-child)');
	removeTableLeaveHeaders.forEach(row => row.remove());
	const mainTableBody = document.querySelector('.main-table');
	data.forEach(el => {
		const newRow = document.createElement('div');
		newRow.classList.add('main-table-row');
		const { Country, NewConfirmed, NewDeaths, NewRecovered, TotalConfirmed, TotalDeaths, TotalRecovered } = el;
		const ActiveCases = TotalConfirmed - TotalDeaths - TotalRecovered;
		const dataArr = [
			Country,
			NewConfirmed,
			TotalConfirmed,
			NewDeaths,
			TotalDeaths,
			NewRecovered,
			TotalRecovered,
			ActiveCases
		];
		for (let item of dataArr) {
			const newCell = document.createElement('div');
			newCell.classList.add('main-table-cell');
			newCell.innerText = item.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			newRow.appendChild(newCell);
		}
		mainTableBody.appendChild(newRow);
	});
}

// Function that sorts column tables when a table header is clicked
function sortMainTableCols(clickedOn, e) {
	// Copy the countries data array as we don't want to mutate the original
	const data = [ ...globalData.Countries ];

	// Add a new key/value to each object in data array that represents the active coronavirus cases
	data.forEach(obj => {
		obj.ActiveCases = obj.TotalConfirmed - obj.TotalDeaths - obj.TotalRecovered;
	});

	// Only the clicked header should have the 'sorted' class
	allTableHeaders.forEach(header => {
		console.log(header);
		if (header !== e.target) {
			header.classList.remove('sorted');
		}
	});

	// Sorting function
	let sorted = data.sort((a, b) => {
		let first = a[clickedOn];
		let second = b[clickedOn];
		if (e.target.classList.contains('sorted')) {
			if (first > second) return -1;
			if (second > first) return 1;
		} else {
			if (first > second) return 1;
			if (second > first) return -1;
		}
	});

	// Re-render the main table with the new sorted data
	renderMainTable(sorted);

	// Because we re-render the table, we need to re-do the event listener for each country cell
	createChartContainer();
}

// Event listeners
allTableHeaders.forEach(header => {
	header.addEventListener('click', e => {
		// When a header cell is clicked: toggle sorted class so we know which column is being sorted
		e.target.classList.toggle('sorted');
		const clickedOn = e.target.dataset.header;

		// Call sorting function
		sortMainTableCols(clickedOn, e);
	});
});

window.addEventListener('load', callThings);

// Function that deals with creating a new chart container element everytime a country cell is clicked
function createChartContainer() {
	let country = '';
	// Select all cells with a country name in it
	const countryCells = document.querySelectorAll('.main-table-cell:first-child:not(.chart)');
	countryCells.forEach(cell => {
		cell.addEventListener('click', e => {
			// If chart already exists or user clicked the same country, remove the chart
			// Also remove the calendar that flatpickr appends to the body
			const chartContainer = document.querySelector('.chart-container');
			if (chartContainer !== null) {
				const pickerEl = document.querySelector('.flatpickr-calendar');
				pickerEl.remove();
				const containsActiveClass = chartContainer.classList.contains('active');
				const sameClickedCountry = chartContainer.previousElementSibling === e.target.parentElement;
				if (containsActiveClass && sameClickedCountry) {
					chartContainer.remove();
					return;
				}
				chartContainer.remove();
			}

			// Create elements for the chart and it's container and insert them after the clicked parents row element
			const newChartContainer = document.createElement('div');
			newChartContainer.classList.add('chart-container', 'active');
			const clickedParent = e.target.parentElement;
			clickedParent.insertAdjacentElement('afterend', newChartContainer);
			const newChart = document.createElement('div');
			newChart.classList.add('chart');
			newChartContainer.appendChild(newChart);

			// Get country name and call getData function
			country = e.target.innerText.toLowerCase().replace('(', '').replace(')', '');
			getData(country);
		});
	});
}

async function getData(country) {
	// Create dates to use in the api call
	const firstDate = dayjs().subtract(14, 'days').format('YYYY-MM-DD') + 'T00:00:00Z';
	const today = dayjs().format('YYYY-MM-DD') + 'T00:00:00Z';
	const res = await fetch(
		`https://api.covid19api.com/total/country/${country}/status/confirmed?from=${firstDate}&to=${today}`
	);
	const data = await res.json();

	// Push only the keys and values we want from the api into an array; this is the data the chart will display
	let chartDataArr = [];
	data.forEach(element => {
		chartDataArr.push({ x: element.Date.replace('T00:00:00Z', ''), y: element.Cases });
	});

	// Use array as an argument when calling renderChart
	renderChart(chartDataArr);
}

function datePickerRender(chart) {
	console.log('DATEPICKERRENDER');

	// Create a new input element for the date picker and render it
	const picker = document.createElement('input');
	picker.classList.add('picker');
	chart.parentElement.prepend(picker);
	flatpickr(picker, {
		mode       : 'range',
		maxDate    : 'today',
		dateFormat : 'Y-m-d'
	});
}

function renderChart(data) {
	console.log('RENDERCHART');

	// Create chart options
	let options = {
		chart      : {
			height     : 400,
			type       : 'line',
			dropShadow : {
				enabled : true,
				color   : '#000',
				top     : 18,
				left    : 7,
				blur    : 10,
				opacity : 0.2
			}
		},
		stroke     : {
			curve : 'smooth'
		},
		series     : [
			{
				name : 'Total Cases',
				data : data
			}
		],
		xaxis      : {
			type   : 'datetime',
			labels : {
				datetimeFormatter : {
					year  : 'yyyy',
					month : "MMM 'yy"
				}
			},
			title  : {
				text : 'Date'
			}
		},
		yaxis      : {
			title : {
				text : 'Total Cases'
			}
		},
		colors     : [ 'rgb(78, 125, 228)' ],
		dataLabels : {
			enabled : true
		}
	};

	// Render the chart inside chartEl
	const chartEl = document.querySelector('.chart');
	let chart = new ApexCharts(chartEl, options);
	chart.render();

	// Call datePickerRender so that a date picker will be prepended to the chartEl
	datePickerRender(chartEl);
}

async function callThings() {
	await getSummary();
	createChartContainer();
}
