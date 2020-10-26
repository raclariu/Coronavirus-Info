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

function sortMainTableCols(clickedOn, e) {
	const data = [ ...globalData.Countries ];
	data.forEach(obj => {
		obj.ActiveCases = obj.TotalConfirmed - obj.TotalDeaths - obj.TotalRecovered;
	});

	allTableHeaders.forEach(header => {
		if (header !== e.target) {
			header.classList.remove('sorted');
		}
	});

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
	console.log(sorted);
	renderMainTable(sorted);
	test();
}

// Event listeners

allTableHeaders.forEach(header => {
	header.addEventListener('click', e => {
		e.target.classList.toggle('sorted');
		const clickedOn = e.target.dataset.header;
		console.log(clickedOn);
		sortMainTableCols(clickedOn, e);
	});
});

async function callThings() {
	await getSummary();
	test();
}

window.addEventListener('load', callThings);
// add chart below clicked table row country
let country = '';
function test() {
	const countryCell = document.querySelectorAll('.main-table-cell:first-child:not(.chart)');
	console.log(countryCell);
	countryCell.forEach(el => {
		el.addEventListener('click', e => {
			const chart = document.querySelector('.chart');
			console.dir(chart);
			console.dir(e.target);
			if (chart !== null) {
				chart.remove();
			}

			country = e.target.innerText.toLowerCase().replace('(', '').replace(')', '');
			const clickedParent = e.target.parentElement;
			const newRow = document.createElement('div');
			newRow.classList.add('chart-container');
			const newDiv = document.createElement('div');
			newDiv.classList.add('chart');
			newRow.appendChild(newDiv);
			clickedParent.insertAdjacentElement('afterend', newRow);
			console.log(country);
			if (country) {
				getData(country);
			}
		});
	});
}

const picker = document.querySelector('#picker');
flatpickr(picker, {
	mode       : 'range',
	maxDate    : 'today',
	dateFormat : 'Y-m-d'
});

async function getData(country) {
	console.log(country);
	let arr = [];
	const firstDate = dayjs().subtract(14, 'days').format('YYYY-MM-DD') + 'T00:00:00Z';
	const today = dayjs().format('YYYY-MM-DD') + 'T00:00:00Z';
	const res = await fetch(
		`https://api.covid19api.com/total/country/${country}/status/confirmed?from=${firstDate}&to=${today}`
	);
	console.log(`https://api.covid19api.com/total/country/${country}/status/confirmed?from=${firstDate}&to=${today}`);
	const data = await res.json();
	console.log(data);
	data.forEach(element => {
		arr.push({ x: element.Date.replace('T00:00:00Z', ''), y: element.Cases });
	});
	let options = {
		chart  : {
			height : 400,
			type   : 'area'
		},
		series : [
			{
				name : 'Cases',
				data : arr
			}
		],
		xaxis  : {
			type   : 'datetime',
			labels : {
				datetimeFormatter : {
					year  : 'yyyy',
					month : "MMM 'yy"
				}
			}
		},
		colors : [ 'rgb(78, 125, 228)' ]
	};

	let chart = new ApexCharts(document.querySelector('.chart'), options);
	chart.render();
}
