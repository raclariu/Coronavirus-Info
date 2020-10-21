// async function getData() {
// 	let arr = [];
// 	const res = await fetch('https://api.covid19api.com/dayone/country/romania/status/confirmed');
// 	const data = await res.json();
// 	console.log(data);
// 	data.forEach(element => {
// 		arr.push({ x: element.Date.replace('T00:00:00Z', ''), y: element.Cases });
// 	});
// 	let options = {
// 		chart  : {
// 			height     : 380,
// 			width      : '100%',
// 			type       : 'bar',
// 			animations : {
// 				initialAnimation : {
// 					enabled : false
// 				}
// 			}
// 		},
// 		series : [
// 			{
// 				name : 'Cases',
// 				data : arr
// 			}
// 		],
// 		xaxis  : {
// 			type   : 'datetime',
// 			labels : {
// 				datetimeFormatter : {
// 					year  : 'yyyy',
// 					month : "MMM 'yy"
// 				}
// 			}
// 		},
// 		colors : [ '#9C27B0' ]
// 	};

// 	let chart = new ApexCharts(document.querySelector('#chart'), options);
// 	chart.render();
// }

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
}

// Event listeners

allTableHeaders.forEach(header => {
	header.addEventListener('click', e => {
		e.target.classList.toggle('sorted');
		const clickedOn = e.target.dataset.header;
		sortMainTableCols(clickedOn, e);
	});
});

// add chart below clicked table row country
function test() {
	const trNoHeader = document.querySelectorAll('.main-table-body tr:not(:first-child)');
	trNoHeader.forEach(el => {
		el.addEventListener('click', e => {
			console.log(e.target);
			console.dir(e.target);
		});
	});
}

getSummary();
