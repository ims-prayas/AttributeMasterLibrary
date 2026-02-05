import { Component, OnInit } from '@angular/core';
import {
  AttributeMasterService,
  AttributeDetails,
} from '../../attribute-master.service';

@Component({
  selector: 'lib-attribute-table',
  templateUrl: './attribute-table.component.html',
  styleUrls: ['./attribute-table.component.css'],
})
export class AttributeTableComponent implements OnInit {
  tableData: AttributeDetails[] = [];
  page: number = 1;
  itemsPerPage: number = 10;

  headings = [
    'Serial Order No',
    'Attribute Name',
    'Input Type',
    'Parent Attributes',
    'Unique Constraint',
    'Mandatory Input',
    'Use As Barcode',
  ];

  constructor(private attributeService: AttributeMasterService) {}

  ngOnInit(): void {
    this.attributeService.tableData$.subscribe(
      (data) => (this.tableData = data),
    );
  }

  onEdit(item: AttributeDetails) {
    this.attributeService.editDataSubject.next(item);
  }

  onDelete(item: AttributeDetails) {
    if(confirm('Are you sure you want to delete this attribute? ')){
      this.attributeService.deleteAttribute(item.ID!);
    }
  }
}
