const express = require("express");

const router = express.Router();

var fetchuser = require("../middleware/fetchuser");

const Notes = require("../models/Notes");

// ROUTER 1: Get all the notes using: GET "/api/notes/fetchallnotes". Login required

router.get("/fetchallnotes", fetchuser, async (req, res) => {
  const notes = await Notes.find({ user: req.user.id });

  res.json(notes);
});

// ROUTER 2: Add a new note using: POST "/api/notes/addnote". Login required

router.post("/addnote", fetchuser, async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    // Create a new note
    const note = new Notes({
      title: title,
      description: description,
      tag: tag,
      user: req.user.id,
    });

    // Save the note in database
    const savedNote = await note.save();

    // Send saved note as response
    res.json(savedNote);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error");
  }
});

// ROUTER 3: Update an existing note using: PUT "/api/notes/updatenote/:id". Login required

router.put("/updatenote/:id", fetchuser, async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    // Create a newNote object
    const newNote = {};

    if (title) {
      newNote.title = title;
    }

    if (description) {
      newNote.description = description;
    }

    if (tag) {
      newNote.tag = tag;
    }

    // Find the note by ID
    const note = await Notes.findById(req.params.id);

    if (!note) {
      return res.status(404).send("Note not found");
    }

    // Check if the user is the owner of the note
    if (note.user.toString() !== req.user.id) {
      return res.status(401).send("Not allowed");
    }

    // Update the note
    const updatedNote = await Notes.findByIdAndUpdate(
      req.params.id,
      { $set: newNote },
      { new: true },
    );

    // Send updated note as response
    res.json(updatedNote);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error");
  }
});

//ROUTE 4: Delete an existing Note using: DELETE "/api/notes/deletenote". Login required

router.delete("/deletenote/:id", fetchuser, async (req, res) => {
  try {
    // Find the note by ID
    const note = await Notes.findById(req.params.id);

    if (!note) {
      return res.status(404).send("Note not found");
    }

    // Check if the user is the owner of the note
    if (note.user.toString() !== req.user.id) {
      return res.status(401).send("Not allowed");
    }

    // Delete the note
    const deletedNote = await Notes.findByIdAndDelete(req.params.id);

    // Send deleted note as response
    res.json({ success: "Note has been deleted", note: deletedNote });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server Error");
  }
});

module.exports = router;
