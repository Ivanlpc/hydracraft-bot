const fs = require('fs')
const ChartJsImage = require('chartjs-to-image')
const path = require('../../config/config.json').chart_folder

const createTopStaffsSinceChart = async (stats) => {
  const chart = new ChartJsImage()
  chart.setConfig({
    type: 'bar',
    data: {
      labels: stats.map(x => x.username),
      datasets: [{
        label: 'Número de sanciones',
        data: stats.map(x => x.count),
        backgroundColor: '#8BC1F7',
        borderColor: '#519DE9',
        borderWidth: 1
      }]
    }
  })
  chart.setBackgroundColor('#ffffff')
  chart.setHeight(600)
  chart.setWidth(800)
  const randomName = Math.random().toString(36).substring(7)
  if (!fs.existsSync(path)) fs.mkdirSync(path)
  const chartPath = path + '/' + randomName + '.png'
  await chart.toFile(chartPath)
  return chartPath
}

const deleteChart = (chartPath) => {
  fs.unlinkSync(chartPath)
}

module.exports = {
  createTopStaffsSinceChart,
  deleteChart
}
