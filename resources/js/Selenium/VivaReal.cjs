const { Builder, By } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

// Configuração do WebDriver
const driver = new Builder().forBrowser('chrome').build();

// Configuração da conexão com o banco de dados
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'laravel_integration'
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados.');
});

(async function scrapeData() {
  try {
    await driver.get('https://www.vivareal.com.br/venda/rio-grande-do-sul/sao-leopoldo/');
    await driver.manage().setTimeouts({ implicit: 10000 });

    // Aceitando cookies
    let botaoCookies = await driver.findElement(By.className('cookie-notifier__cta'));
    await botaoCookies.click();

    // Criando uma pasta para armazenar os screenshots
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots');
    }

    // Encontrando os anúncios
    let anuncios = await driver.findElements(By.css('div[data-type="property"]'));

    // Iterando sobre os anúncios
    for (let i = 0; i < anuncios.length; i++) {
      let anuncio = anuncios[i];
      let url, local, preco;

      try {
        url = await anuncio.findElement(By.css('a.property-card__content-link.js-card-title')).getAttribute('href');
      } catch (error) {
        url = 'URL não encontrada';
      }

      try {
        local = await anuncio.findElement(By.className('property-card__address')).getText();
      } catch (error) {
        local = 'Local não encontrado';
      }

      try {
        preco = await anuncio.findElement(By.className('property-card__price')).getText();
      } catch (error) {
        preco = 'Preço não encontrado';
      }

      console.log(`URL: ${url}`);
      console.log(`Local: ${local}`);
      console.log(`Preço: ${preco}`);
      console.log('-'.repeat(50));

      let screenshotPath = path.join('screenshots', `anuncio_${i + 1}.png`);
      await anuncio.takeScreenshot().then(
        function(image, err) {
          fs.writeFileSync(screenshotPath, image, 'base64');
        }
      );
      console.log(`Screenshot salvo em: ${screenshotPath}`);

      // Inserir dados no banco de dados
      const query = 'INSERT INTO anuncios (data, url, local, preco, screenshot) VALUES (?, ?, ?, ?, ?)';
      const values = [new Date().toISOString(), url, local, preco, screenshotPath];

      connection.query(query, values, (err, results) => {
        if (err) {
          console.error('Erro ao inserir dados no banco de dados:', err);
          return;
        }
        console.log('Dados inseridos no banco de dados:', results);
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    await driver.quit();
    connection.end((err) => {
      if (err) {
        console.error('Erro ao finalizar a conexão ao banco de dados:', err);
      } else {
        console.log('Conexão ao banco de dados finalizada.');
      }
    });
  }
})();
