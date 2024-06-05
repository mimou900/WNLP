function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  // Retrieve the parameter value from the URL
  let paramValue = urlParams.get(name);
  
  if (paramValue) {
    // Replace '+' signs with spaces
    paramValue = paramValue.replace(/\+/g, ' ');
    // Decode URI component
    paramValue = decodeURIComponent(paramValue);
  }
  
  return paramValue;
}

// Retrieve and decode the 'query' parameter
const query = getQueryParameter('query');
const limit = parseInt(getQueryParameter('limit'));
const type = getQueryParameter('type');


const apiUrl = `http://localhost:5000/analyze?query=${encodeURIComponent(query)}&limit=${limit}`;

function fetchAndDisplayData() {
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'flex';

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      loadingElement.style.display = 'none';
      const tableBody = document.querySelector('.table__body tbody');
      tableBody.innerHTML = '';

      data.title_ratings.forEach((rating, index) => {
        const row = document.createElement('tr');
        const indexCell = document.createElement('td');
        indexCell.textContent = index + 1;
        row.appendChild(indexCell);

        const userCell = document.createElement('td');
        const userImg = document.createElement('img');
        userImg.src = rating.author.profile_picture;
        userImg.alt = rating.author.username;
        userImg.style.width = '40px';
        userCell.append(rating.author.username);
        userCell.appendChild(userImg);
        row.appendChild(userCell);

        const tweetCell = document.createElement('td');
        tweetCell.textContent = rating.title;
        row.appendChild(tweetCell);

        const scoreCell = document.createElement('td');
        scoreCell.textContent = rating.score.toFixed(2);
        row.appendChild(scoreCell);

        const statusCell = document.createElement('td');
        const statusParagraph = document.createElement('p');
        if (rating.label === 'positive') {
          statusParagraph.className = 'status delivered';
          statusParagraph.textContent = 'إيجابي';
        } else if (rating.label === 'neutral') {
          statusParagraph.className = 'status shipped';
          statusParagraph.textContent = 'محايد';
        } else {
          statusParagraph.className = 'status cancelled';
          statusParagraph.textContent = 'سلبي';
        }
        statusCell.appendChild(statusParagraph);
        row.appendChild(statusCell);
        tableBody.appendChild(row);
      });

      const rows = document.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const tds = row.querySelectorAll('td');
        const reversedTds = Array.from(tds).reverse();
        tds.forEach(td => td.remove());
        reversedTds.forEach(td => row.appendChild(td));
      });

      const search = document.querySelector('.input-group input');
      const table_rows = document.querySelectorAll('tbody tr');
      const table_headings = document.querySelectorAll('thead th');

      search.addEventListener('input', searchTable);

      function searchTable() {
        table_rows.forEach((row, i) => {
          const table_data = row.textContent.toLowerCase();
          const search_data = search.value.toLowerCase();
          row.classList.toggle('hide', table_data.indexOf(search_data) < 0);
          row.style.setProperty('--delay', i / 25 + 's');
        });

        document.querySelectorAll('tbody tr:not(.hide)').forEach((visible_row, i) => {
          visible_row.style.backgroundColor = (i % 2 == 0) ? 'transparent' : '#0000000b';
        });
      }

      table_headings.forEach((head, i) => {
        let sort_asc = true;
        head.onclick = () => {
          table_headings.forEach(head => head.classList.remove('active'));
          head.classList.add('active');
          document.querySelectorAll('td').forEach(td => td.classList.remove('active'));
          table_rows.forEach(row => {
            row.querySelectorAll('td')[i].classList.add('active');
          });
          head.classList.toggle('asc', sort_asc);
          sort_asc = head.classList.contains('asc') ? false : true;
          sortTable(i, sort_asc);
        };
      });

      function sortTable(column, sort_asc) {
        [...table_rows].sort((a, b) => {
          const first_row = a.querySelectorAll('td')[column].textContent.toLowerCase();
          const second_row = b.querySelectorAll('td')[column].textContent.toLowerCase();
          return sort_asc ? (first_row < second_row ? 1 : -1) : (first_row < second_row ? -1 : 1);
        }).map(sorted_row => document.querySelector('tbody').appendChild(sorted_row));
      }

      const pdf_btn = document.querySelector('#toPDF');
      const customers_table = document.querySelector('#customers_table');

      const toPDF = function (customers_table) {
        const html_code = `<!DOCTYPE html><link rel="stylesheet" type="text/css" href="style2.css"><div class="card-03" id="bgt" >${bgt.innerHTML}</div>`;
        const new_window = window.open();
        new_window.document.write(html_code);
        setTimeout(() => {
          new_window.print();
          new_window.close();
        }, 400);
      };

      pdf_btn.onclick = () => {
        toPDF(customers_table);
      };

      const json_btn = document.querySelector('#toJSON');

      const toJSON = function (table) {
        let table_data = [],
          t_head = [],
          t_headings = table.querySelectorAll('th'),
          t_rows = table.querySelectorAll('tbody tr');

        for (let t_heading of t_headings) {
          let actual_head = t_heading.textContent.trim().split(' ');
          t_head.push(actual_head.splice(0, actual_head.length - 1).join(' ').toLowerCase());
        }

        t_rows.forEach(row => {
          const row_object = {},
            t_cells = row.querySelectorAll('td');

          t_cells.forEach((t_cell, cell_index) => {
            const img = t_cell.querySelector('img');
            if (img) {
              row_object['customer image'] = decodeURIComponent(img.src);
            }
            row_object[t_head[cell_index]] = t_cell.textContent.trim();
          });
          table_data.push(row_object);
        });

        return JSON.stringify(table_data, null, 4);
      };

      json_btn.onclick = () => {
        const json = toJSON(customers_table);
        downloadFile(json, 'json');
      };

      const csv_btn = document.querySelector('#toCSV');

      const toCSV = function (table) {
        const t_heads = table.querySelectorAll('th'),
          tbody_rows = table.querySelectorAll('tbody tr');

        const headings = [...t_heads].map(head => {
          let actual_head = head.textContent.trim().split(' ');
          return actual_head.splice(0, actual_head.length - 1).join(' ').toLowerCase();
        }).join(',') + ',' + 'image name';

        const table_data = [...tbody_rows].map(row => {
          const cells = row.querySelectorAll('td'),
            img = decodeURIComponent(row.querySelector('img').src),
            data_without_img = [...cells].map(cell => cell.textContent.replace(/,/g, ".").trim()).join(',');

          return data_without_img + ',' + img;
        }).join('\n');

        return headings + '\n' + table_data;
      };

      csv_btn.onclick = () => {
        const csv = toCSV(customers_table);
        downloadFile(csv, 'csv', 'customer orders');
      };

      const excel_btn = document.querySelector('#toEXCEL');

      const toExcel = function (table) {
        const t_heads = table.querySelectorAll('th'),
          tbody_rows = table.querySelectorAll('tbody tr');

        const headings = [...t_heads].map(head => {
          let actual_head = head.textContent.trim().split(' ');
          return actual_head.splice(0, actual_head.length - 1).join(' ').toLowerCase();
        }).join('\t') + '\t' + 'image name';

        const table_data = [...tbody_rows].map(row => {
          const cells = row.querySelectorAll('td'),
            img = decodeURIComponent(row.querySelector('img').src),
            data_without_img = [...cells].map(cell => cell.textContent.trim()).join('\t');

          return data_without_img + '\t' + img;
        }).join('\n');

        return headings + '\n' + table_data;
      };

      excel_btn.onclick = () => {
        const excel = toExcel(customers_table);
        downloadFile(excel, 'excel');
      };

      const downloadFile = function (data, fileType, fileName = '') {
        const a = document.createElement('a');
        a.download = fileName;
        const mime_types = {
          'json': 'application/json',
          'csv': 'text/csv',
          'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        a.href = `data:${mime_types[fileType]};charset=utf-8,${encodeURIComponent(data)}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      const { total_rating, title_ratings } = data;

      const positiveScores = [];
      const neutralScores = [];
      const negativeScores = [];
      data.title_ratings.forEach(comment => {
        if (comment.label === 'positive') {
          positiveScores.push(comment.score);
        } else if (comment.label === 'neutral') {
          neutralScores.push(comment.score);
        } else if (comment.label === 'negative') {
          negativeScores.push(comment.score);
        }
      });

      const ctx = document.getElementById('barChart').getContext('2d');
      const barChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          datasets: [{
            label: 'إيجابي',
            data: positiveScores,
            borderColor: '#86e49d',
            borderWidth: 1,
            backgroundColor: '#86e49e58',
            fill: false
          }, {
            label: 'محايد',
            data: neutralScores,
            borderColor: '#6fcaea',
            borderWidth: 1,
            backgroundColor: '#6fc9ea8e',
            fill: false
          }, {
            label: 'سلبي',
            data: negativeScores,
            borderColor: '#ffa288',
            borderWidth: 1,
            backgroundColor: '#ffa28884',
            fill: false
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

      const ctx2 = document.getElementById('pieChart').getContext('2d');
      const lineChart = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          datasets: [{
            label: 'إيجابي',
            data: positiveScores,
            borderColor: '#86e49d',
            borderWidth: 1,
            backgroundColor: '#86e49e58',
            fill: true
          }, {
            label: 'محايد',
            data: neutralScores,
            borderColor: '#6fcaea',
            borderWidth: 1,
            backgroundColor: '#6fc9ea8e',
            fill: true
          }, {
            label: 'سلبي',
            data: negativeScores,
            borderColor: '#ffa288',
            backgroundColor: '#ffa28884',
            fill: true
          }]
        },
        options: {
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      });

      const ctx3 = document.getElementById('lineChart').getContext('2d');
      const pieChart = new Chart(ctx3, {
        type: 'doughnut',
        data: {
          labels: ['سلبي', 'محايد', 'إيجابي'],
          datasets: [{
            label: 'radar Chart',
            data: [total_rating.negative, total_rating.neutral, total_rating.positive],
            backgroundColor: [
              '#ffa28884',
              '#6fc9ea8e',
              '#86e49e58'
            ],
            borderColor: [
              '#ffa28884',
              '#6fc9ea8e',
              '#86e49e58'
            ],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

      let options = {
        startAngle: -1.55,
        size: 90,
        value: 0.50,
        fill: { gradient: ['#ffffffb2', '#ffffffb2'] }
      };
      $(".circle .bar").circleProgress(options).on('circle-animation-progress',
        function (event, progress, stepValue) {
          $(this).parent().find("span").text(String(stepValue.toFixed(2).substr(2)) + "%");
        });
      $(".js .bar").circleProgress({
        value: 0.70
      });
      $(".react .bar").circleProgress({
        value: 0.60
      });

      const tot = total_rating.negative + total_rating.neutral + total_rating.positive;
      $(document).ready(function () {
        $('.card-01').eq(0).find('.bar').circleProgress({ value: (total_rating.negative) / tot });
        $('.card-01').eq(1).find('.bar').circleProgress({ value: (total_rating.neutral) / tot });
        $('.card-01').eq(2).find('.bar').circleProgress({ value: (total_rating.positive) / tot });

        $(".circle .bar").on('circle-animation-progress', function (event, progress, stepValue) {
          $(this).parent().find("span").text(String(stepValue.toFixed(2) * 100) + "%");
        });
      });
    })
    .catch(error => {
      console.error('Error fetching data from API:', error);
    });
}

document.addEventListener('DOMContentLoaded', fetchAndDisplayData);