import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'lib-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css'],
})
export class DialogComponent {

 DialogObj:DialogObj = <DialogObj>{};
  constructor(@Inject(MAT_DIALOG_DATA) private data:DialogObj){
    this.DialogObj = data;
  }
}

export interface DialogObj{
  Title:string;
  Message:string;
}
