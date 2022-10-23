import { NgIfContext } from '@angular/common';
import { Component, ViewChildren, OnInit } from '@angular/core';
import {MatTable} from '@angular/material/table';
import { Clipboard } from '@angular/cdk/clipboard';

interface Song {
  no: number,
  title: string,
  bpm: number,
  signalVisible: boolean,
  signalIntervalId: number | false
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'BpmPrompter';
  songs: Array<Song> = []

  @ViewChildren(MatTable) tables: MatTable<Song>[] = [];

  constructor(private clipboard: Clipboard) {}

  ngOnInit(){
    this.loadSongsFromHash();
  }

  removeSong(no: number){
    let newNo = 1;

    const oldSongs = this.songs;

    this.songs = [];

    for (const s of oldSongs) {
      this.removeSignalTimer(s)
      if (s.no == no) {
        continue;
      }
      const newSong = s;
      s.no = newNo;
      this.addSong(newSong)
      newNo += 1;
    }
    this.tables.forEach((t) => t.renderRows());
  }

  moveSongUp(no: number){
    if (no == 1) {
      return;
    }
    const index = no - 1;

    const tmp = this.songs[index - 1];
    this.songs[index - 1] = this.songs[index];
    this.songs[index] = tmp;

    this.songs[index- 1].no = index
    this.songs[index].no = index + 1
    this.makeHashFromSongs();
    this.tables.forEach((t) => t.renderRows());
  }

  moveSongDown(no: number){
    if (no == this.songs.length) {
      return;
    }

    const index = no - 1;

    const tmp = this.songs[index];
    this.songs[index] = this.songs[index + 1];
    this.songs[index + 1] = tmp;

    this.songs[index].no = index + 1
    this.songs[index + 1].no = index + 2
    this.makeHashFromSongs();
    this.tables.forEach((t) => t.renderRows());

  }


  addNewSong() {
    const song: Song = {
      no: 0,
      title: 'song title',
      bpm : 120,
      signalVisible: false,
      signalIntervalId: false
    }
    this.addSong(song)
  }

  addSong(song: Song) {
    song.no = this.songs.length + 1;
    this.songs.push(song)
    this.setSignalTimer(song)
    this.tables.forEach((t) => t.renderRows());
    this.makeHashFromSongs();
  }

  onBpmChanged(song: Song) {
    this.removeSignalTimer(song) 
    this.setSignalTimer(song) 
    this.makeHashFromSongs();
  }
  onTitleChanged(_: Song) {
    this.makeHashFromSongs();
  }

  copyShareLink(){
    const url = window.location.href;
    this.clipboard.copy(url);
    alert('share link was copied to your clipboard')
  }

  private setSignalTimer(song: Song){
    this.removeSignalTimer(song) 

    const beatMillSec = (60.0 / song.bpm) * 1000;
    song.signalIntervalId = window.setInterval(()=>{
      this. flashSignal(song)
    }, beatMillSec)
  }

  private removeSignalTimer(song: Song){
    if (song.signalIntervalId !== false) {
      window.clearInterval(song.signalIntervalId)
    }
  }

  private flashSignal(song: Song){
    song.signalVisible = true;
    setTimeout(() => {
      song.signalVisible = false;
    }, 100)
  }

  private makeHashFromSongs() {
    const songs = this.songs.map(s => {
      return {
        title: s.title,
        bpm: s.bpm
      }
    })
    const json = JSON.stringify(songs)
    window.location.hash = json;
  }
  
  private loadSongsFromHash(){
    try {
      const hash = decodeURI(window.location.hash.slice(1));
      const songs = JSON.parse(hash)
      songs.forEach((s: any) => {
        const no = this.songs.length + 1;
        const title = s.title || "new song";
        const maybeBpm = parseInt(s.bpm)
        let bpm;
        if (isNaN(maybeBpm)) {
          bpm = 120;
        } else {
          bpm = maybeBpm;
        }

        const newSong: Song = {
          no,
          title,
          bpm,
          signalVisible: false,
          signalIntervalId: false
        }
        this.addSong(s)
      });
    } catch(e) {
      console.error(e);
      this.addNewSong();
    }
  }

}
