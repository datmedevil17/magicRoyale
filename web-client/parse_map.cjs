
const fs = require('fs');
const path = '/home/rakshittt/clash_royale_game/client/src/main/java/views/Map/TwoPlayerMap.fxml';

try {
    const xml = fs.readFileSync(path, 'utf8');

    // Regex to find Rectangles with grid coords
    // <Rectangle fill="#8dab3b" ... GridPane.columnIndex="0" GridPane.rowIndex="0" />
    const regex = /<Rectangle\s+fill="([^"]+)"[^>]*GridPane\.columnIndex="(\d+)"\s+GridPane\.rowIndex="(\d+)"/g;

    const map = [];
    let match;
    let maxRow = 0;
    let maxCol = 0;

    while ((match = regex.exec(xml)) !== null) {
        const color = match[1];
        const col = parseInt(match[2]);
        const row = parseInt(match[3]);

        if (!map[row]) map[row] = [];
        map[row][col] = color;

        if (row > maxRow) maxRow = row;
        if (col > maxCol) maxCol = col;
    }

    fs.writeFileSync('src/game/scenes/MapData.json', JSON.stringify({
        rows: maxRow + 1,
        cols: maxCol + 1,
        grid: map
    }, null, 2));
    console.log("Map data saved to src/game/scenes/MapData.json");

} catch (err) {
    console.error('Error:', err);
}
