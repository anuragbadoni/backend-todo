const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
var hms = require("humanize-ms");
var ms = require("ms");
const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = {
  origin: "https://kanban-board-frontend-beige.vercel.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors());

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://imt2021109:ved%40123@cluster0.sv47wz8.mongodb.net/",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Define Schema and Models
const cardSchema = new mongoose.Schema({
  id: String,
  title: String,
  labels: Array,
  date: String,
  tasks: Array,
});

const boardSchema = new mongoose.Schema({
  id: String,
  title: String,
  cards: [cardSchema],
});

const Board = mongoose.model("Board", boardSchema);

app.use(express.json());

function parseFunc(todo) {
  var t = todo;
  var remindToken = " in ";
  var reminder = t.toString().indexOf(remindToken);
  console.log(reminder, "reminder", t.toString());
  if (reminder > 0) {
    var time = t.slice(reminder + remindToken.length);
    time = time.replace(/\n$/, "");

    var period = hms(time);

    console.log("period: " + period);

    // remove it
    t = t.slice(0, reminder);
    if (typeof period != "undefined") {
      t += " [" + ms(period) + "]";
    }
  }
  console.log(t, "i am herer");
  return t;
}

// Get all boards
app.get("/api/boards", async (req, res) => {
  try {
    const boards = await Board.find();
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new board
app.post("/api/boards", async (req, res) => {
  const { name } = req.body;
  try {
    const board = new Board({
      id: Date.now().toString(),
      title: name,
      cards: [],
    });
    await board.save();
    res.status(201).json(board);
  } catch (error) {
    res.status(400).json({ error: "Bad request" });
  }
});

// Delete a board
app.delete("/api/boards/:id", async (req, res) => {
  const boardId = req.params.id;

  try {
    await Board.findOneAndDelete({ id: boardId });
    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: "Bad request" });
  }
});

// Update a board's cards
app.put("/api/boards/:id", async (req, res) => {
  const boardId = req.params.id;
  const { cards } = req.body;

  try {
    const updatedBoard = await Board.findOneAndUpdate(
      { id: boardId },
      { cards },
      { new: true }
    );
    if (!updatedBoard) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.json(updatedBoard);
  } catch (error) {
    res.status(400).json({ error: "Bad request" });
  }
});
// Add a card to a board
app.post("/api/boards/:id/cards", async (req, res) => {
  const boardId = req.params.id;
  console.log(req.body, "body");
  let title = req.body.title;
  console.log(title, "title");
  title = parseFunc(title);
  console.log("new title ", title);
  try {
    const board = await Board.findOne({ id: boardId });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    const newCard = {
      id: Date.now().toString(),
      title,
      labels: [],
      date: "",
      tasks: [],
    };

    board.cards.push(newCard);
    await board.save();

    res.status(201).json(newCard);
  } catch (error) {
    res.status(400).json({ error: "Bad request" });
  }
});
// Update a card in a board
app.put("/api/boards/:bid/cards/:cid", async (req, res) => {
  const boardId = req.params.bid;
  const cardId = req.params.cid;
  const updatedCard = req.body; // Updated card details

  try {
    const board = await Board.findOne({ id: boardId });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    const cardIndex = board.cards.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: "Card not found" });
    }

    board.cards[cardIndex] = updatedCard;
    await board.save();

    res.json(updatedCard);
  } catch (error) {
    res.status(400).json({ error: "Bad request" });
  }
});
// ... Other imports and configurations

// ... Other imports and code

// Update a board's cards (including drag and drop)
app.put("/api/boards/:id", async (req, res) => {
  const boardId = req.params.id;
  const { cards } = req.body;

  try {
    const updatedBoard = await Board.findOneAndUpdate(
      { id: boardId },
      { cards },
      { new: true }
    );
    if (!updatedBoard) {
      return res.status(404).json({ error: "Board not found" });
    }

    res.json(updatedBoard);
  } catch (error) {
    res.status(400).json({ error: "Bad request" });
  }
});

// ... Previous imports and code ...

// Delete a card from a board
app.delete("/api/boards/:bid/cards/:cid", async (req, res) => {
  const boardId = req.params.bid;
  const cardId = req.params.cid;

  try {
    const board = await Board.findOne({ id: boardId });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    const cardIndex = board.cards.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: "Card not found" });
    }

    board.cards.splice(cardIndex, 1);
    await board.save();

    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: "Bad request" });
  }
});

// ... Rest of your code ...

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
