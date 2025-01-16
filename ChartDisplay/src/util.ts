import { format } from 'date-fns';

export function createTradesTable(TradesData, TradesHeading = []) {
	const table = document.createElement('table');

	if (TradesHeading) {
		const tr = document.createElement('tr');
		TradesHeading.forEach((c) => {
			const cell = document.createElement('td');
			cell.innerText = c;
			tr.append(cell);
		});

		table.append(tr);

	}

	TradesData.forEach(cur => {

		const row = document.createElement('tr');

		cur.forEach((c, i) => {
			const cell = document.createElement('td');
			cell.innerText = formatCell(c, i);
			row.append(cell);
		});

		table.append(row);

	});


	return table;

}

function formatCell(content: number, i: number) {
	switch (i) {
		case 0:
		case 2:
			return format(new Date(content), 'yy-MM-dd HH:MM:SS');
		case 4:
			return content === 1 ? 'Long' : 'Short';
		case 1:
		case 3:
		case 8:
			return '$' + content.toLocaleString(undefined, { maximumFractionDigits: 2 });
		case 9:
			return (content * 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%';
	}


	return content;
}
