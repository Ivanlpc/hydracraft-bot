const fs = require('fs')
const ChartJsImage = require('chartjs-to-image')
const chartsConfig = require('../../config/config.json').charts

const createTopStaffsSinceChart = async (usernames, counts, since, until) => {
  const label = (until)
    ? chartsConfig.types.staffTopSince.label.replace('%date%', since + ' - ' + until)
    : chartsConfig.types.staffTopSince.label.replace('%date%', since)
  const chart = new ChartJsImage()
  chart.setConfig({
    type: chartsConfig.types.staffTopSince.type,
    data: {
      labels: usernames,
      datasets: [{
        label,
        data: counts,
        backgroundColor: chartsConfig.barColor,
        borderColor: chartsConfig.borderColor,
        borderWidth: chartsConfig.borderWidth
      }]
    },
    options: {
      plugins: {
        datalabels: {
          color: chartsConfig.datalabelsColor,
          anchor: 'end',
          align: 'top',
          formatter: value => value
        }
      }
    }
  })
  chart.setBackgroundColor(chartsConfig.backgroundColor)
  chart.setHeight(chartsConfig.types.staffTopSince.height)
  chart.setWidth(chartsConfig.types.staffTopSince.width)
  const randomName = Math.random().toString(36).substring(7)
  if (!fs.existsSync(chartsConfig.chart_folder)) fs.mkdirSync(chartsConfig.chart_folder)
  const chartPath = chartsConfig.chart_folder + '/' + randomName + '.png'
  await chart.toFile(chartPath)
  return chartPath
}

const createProgressChart = async (stats, nick) => {
  const chart = new ChartJsImage()
  chart.setConfig({
    type: chartsConfig.types.staffProgress.type,
    data: {
      labels: stats.map(stat => stat.date),
      datasets: [{
        label: chartsConfig.types.staffProgress.label.replace('%nick%', nick),
        fill: false,
        data: stats.map(stat => stat.count),
        backgroundColor: chartsConfig.barColor,
        borderColor: chartsConfig.borderColor,
        borderWidth: chartsConfig.borderWidth
      }]
    }
  })
  chart.setBackgroundColor(chartsConfig.backgroundColor)
  chart.setHeight(chartsConfig.types.staffProgress.height)
  chart.setWidth(chartsConfig.types.staffProgress.width)
  const randomName = Math.random().toString(36).substring(7)
  if (!fs.existsSync(chartsConfig.chart_folder)) fs.mkdirSync(chartsConfig.chart_folder)
  const chartPath = chartsConfig.chart_folder + '/' + randomName + '.png'
  await chart.toFile(chartPath)
  return chartPath
}

const deleteChart = (chartPath) => {
  fs.unlinkSync(chartPath)
}

module.exports = {
  createTopStaffsSinceChart,
  createProgressChart,
  deleteChart
}
