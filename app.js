let globalData;
const allTableHeaders = document.querySelectorAll('th');

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
	const removeTableLeaveHeaders = document.querySelectorAll('.main-table-body tr:not(:first-child)');
	removeTableLeaveHeaders.forEach(tr => tr.remove());
	const mainTableBody = document.querySelector('.main-table-body');
	data.forEach(el => {
		const newTr = document.createElement('tr');
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
			const newCell = document.createElement('td');
			newCell.innerText = item.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			newTr.appendChild(newCell);
		}
		mainTableBody.appendChild(newTr);
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
	renderMainTable(sorted);
	test();
}

// Event listeners

allTableHeaders.forEach(header => {
	header.addEventListener('click', e => {
		e.target.classList.toggle('sorted');
		const clickedOn = e.target.dataset.header;
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
	const trNoHeader = document.querySelectorAll('.main-table-body tr:not(:first-child) td:first-child');
	trNoHeader.forEach(el => {
		el.addEventListener('click', e => {
			const el = document.querySelector('.chart');
			console.dir(el);
			console.dir(e.target);
			if (el !== null) {
				el.remove();
			}

			country = e.target.innerText.toLowerCase().replace('(', '').replace(')', '');
			const clickedParent = e.target.parentElement;
			const newDiv = document.createElement('div');
			newDiv.classList.add('chart');
			clickedParent.insertAdjacentElement('afterend', newDiv);
			console.log(country);
			if (country) {
				getData(country);
			}
		});
	});
}

async function getData(country) {
	console.log(country);
	let arr = [];
	const res = await fetch(
		`https://api.covid19api.com/total/country/${country}/status/confirmed?from=2020-10-01T00:00:00Z&to=2020-10-21T00:00:00Z`
	);
	const data = await res.json();
	console.log(data);
	data.forEach(element => {
		arr.push({ x: element.Date.replace('T00:00:00Z', ''), y: element.Cases });
	});
	let options = {
		chart  : {
			height : 400,
			width  : 1150,
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
