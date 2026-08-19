import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SimpleTableModule } from 'didi-simple-table';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, SimpleTableModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
