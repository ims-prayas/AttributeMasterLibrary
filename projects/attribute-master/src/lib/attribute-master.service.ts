import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ConfigService } from './config.service';
import { DialogComponent } from './components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AttributeValueList } from './components/attribute-value-master/Attribute';

export interface AttributeMaster {
  AttributeType: string;
  ApplyTo?: string;
  IsMappingRequired: boolean;
  MappedBy: string;
  AttributeDetails: AttributeDetails[];
}

export interface AttributeDetails {
  ID?: number;
  AttributeName: string;
  DataType: string;
  OrderNo: string;
  Regex: string;
  HasParent: boolean;
  ParentAttribute: string;
  CheckUniqueConstraint: boolean;
  ConstraintMode: string;
  IsRequired: number;
  UseAsBarcode: boolean;
}

export interface AttributeMapping{
  AttributeType : string;
  ApplyTo: string;
  MappedFor: string;
  AttributesList: MappingDetails[]
}

export interface MappingDetails{
  AttributeListID: number;
}

export interface AttributeValueMaster {
  AttributeType: string;
  ApplyTo: string;
  AttributeValues: AttributeValueList[];
}

@Injectable({
  providedIn: 'root',
})
export class AttributeMasterService {
  attributeMasterObj: AttributeMaster = {
    AttributeType: '',
    ApplyTo: '',
    IsMappingRequired: false,
    MappedBy: '',
    AttributeDetails: [],
  };

  mappingMasterObj : AttributeMapping ={
    AttributeType: '',
    ApplyTo: '',
    MappedFor: '',
    AttributesList: []
  }

  attributeValueMasterObj: AttributeValueMaster = {
    AttributeType: '',
    ApplyTo: '',
    AttributeValues: [],
  };

  private tableDataSubject = new BehaviorSubject<AttributeDetails[]>([]);
  tableData$ = this.tableDataSubject.asObservable();

  public editDataSubject = new Subject<AttributeDetails>();
  editData$ = this.editDataSubject.asObservable();
  private resetFormSubject = new Subject<void>();
  resetForm$ = this.resetFormSubject.asObservable();

  private saveRequestedSubject = new Subject<void>();
  saveRequested$ = this.saveRequestedSubject.asObservable();

  requestSave() {
    this.saveRequestedSubject.next();
  }


  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private dialog: MatDialog
  ) {}

  private get apiUrl(): string {
    return this.configService.getApiUrl();
  }

  private syncTable() {
    this.tableDataSubject.next([...this.attributeMasterObj.AttributeDetails]);
  }



  deleteAttribute(id: number) {
    this.http
      .post(`${this.apiUrl}/deleteAttributeDetail?ID=${id}`, {})
      .subscribe((res: any) => {
        if(res.status == 'ok'){
          this.attributeMasterObj.AttributeDetails = this.attributeMasterObj.AttributeDetails.filter((d) => d.ID !== id)
          .map((d, i) => ({ ...d, sn: i + 1 }));
          this.syncTable();          
        }
      });
  }

  resetForm() {
    this.resetFormSubject.next();
  }

  getAttributeTypes() {
    return this.http.get(`${this.apiUrl}/getAttributeTypeList`);
  }

  getApplyToList(attributeTypeID: string) {
    return this.http.get(`${this.apiUrl}/getApplyToList?attributeType=${attributeTypeID}`);
  }

  getParentAttributes() {
    return this.http.get(`${this.apiUrl}/getParentAttributes`);
  }

  getMappedBy() {
    return this.http.get(`${this.apiUrl}/getMappedByList`);
  }

  getAttributeDetails(attributeType: string, applyTo?: string) {
    return this.http.get<any>(`${this.apiUrl}/getAttributeDetails?attributeType=${attributeType}&applyTo=${applyTo}`);
  }

  getAttributesForMapping(attributeType: string, applyTo?: string, mappedFor?: string){
    return this.http.get(`${this.apiUrl}/getAttributesForMapping?attributeType=${attributeType}&applyTo=${applyTo}&mappedFor=${mappedFor}`);
  }

  loadMaster(attributeType: string, applyTo?: string) {
    return this.getAttributeDetails(attributeType, applyTo).subscribe((res) => {
      if (res.status === 'ok') {
        this.attributeMasterObj = {
          AttributeType: attributeType,
          ApplyTo: applyTo,
          IsMappingRequired: res.result.IsMappingRequired,
          MappedBy: res.result.MappedBy,
          AttributeDetails: res.result.AttributeDetails || [],
        };
        this.syncTable();
      }
    });
  }

  saveMaster() {
    const body = { data: this.attributeMasterObj };
    return this.http.post(`${this.apiUrl}/SaveAttributeMaster`, body);
  }

  saveAttributeMapping(){
    const body = { data: this.mappingMasterObj }
    return this.http.post(`${this.apiUrl}/saveAttributesMapping`, body)
  }


  addOrUpdateRow(row: any, isEdit = false, sn?: number) {
    this.attributeMasterObj.AttributeType = row.AttributeType;
    this.attributeMasterObj.ApplyTo = row.ApplyTo;
    this.attributeMasterObj.IsMappingRequired = row.IsMappingRequired;
    this.attributeMasterObj.MappedBy = row.MappedBy;

    if (!this.attributeMasterObj.AttributeDetails) {
      this.attributeMasterObj.AttributeDetails = [];
    }

    if (row.UseAsBarcode) {
      const exists = this.attributeMasterObj.AttributeDetails.some((r) => r.UseAsBarcode === true && (sn === undefined || r.ID !== sn));
      if (exists) {
        this.openErrorDialog('Only one element can have barcode')
        return;
      }
    }


    const detail: AttributeDetails = {
      AttributeName: row.AttributeName,
      DataType: row.DataType,
      OrderNo: row.OrderNo,
      Regex: row.Regex,
      HasParent: row.HasParent,
      ParentAttribute: row.ParentAttribute,
      CheckUniqueConstraint: row.CheckUniqueConstraint,
      ConstraintMode: row.ConstraintMode,
      IsRequired: row.IsRequired,
      UseAsBarcode: row.UseAsBarcode,
    };

    const otherRows = isEdit ? this.attributeMasterObj.AttributeDetails.filter(r => r.ID !== sn) : this.attributeMasterObj.AttributeDetails;

    if (otherRows.some(r => r.AttributeName.toLowerCase() === detail.AttributeName.toLowerCase())) {
      this.openErrorDialog('Attribute Name already exists.');
    }

    if (otherRows.some(r => r.OrderNo === detail.OrderNo)) {
      this.openErrorDialog('Serial Order No already exists.');
    }


    if (isEdit) {
      const index = this.attributeMasterObj.AttributeDetails.findIndex((r) => r.ID === sn);
      if (index !== -1) {
        this.attributeMasterObj.AttributeDetails[index] = { ...detail, ID: sn };
      } else {
        this.openErrorDialog('Row not found for update');
      }
    } else {
      this.attributeMasterObj.AttributeDetails.push(detail);
    }
    this.tableDataSubject.next([...this.attributeMasterObj.AttributeDetails]);
  }

  clearTable() {
    this.attributeMasterObj.AttributeDetails = [];
    this.tableDataSubject.next([]);
  }

  getAttributeNames(attributeType: string, applyTo?: string) {
    return this.http.get<any>(`${this.apiUrl}/getListOnlyAttributeNames?attributeType=${attributeType}&applyTo=${applyTo}`);
  }

   getParentAttributeInfo(id: number) {
    return this.http.get<any>(`${this.apiUrl}/getParentAttributeInfo?attributeListID=${id}`);
  }

  getAttributeValueList(attributeType: string, applyTo?: string){
    return this.http.get<any>(`${this.apiUrl}/getAttributeValues?attributeType=${attributeType}&applyTo=${applyTo}`);
  }


  hasBarcodeAttribute(excludeId?: number): boolean {
    return this.attributeMasterObj.AttributeDetails.some((r) => r.UseAsBarcode === true && (excludeId === undefined || r.ID !== excludeId));
  }

  openSuccessDialog(Message:string) {
   return this.dialog.open(DialogComponent, {
      minWidth:'25rem',
      data:{
        Title: "Information",
        Message: Message
      }
    });
  }

  openErrorDialog(Message:string) {
    this.dialog.open(DialogComponent, {
      minWidth:'25rem',
      data:{
        Title: "Error",
        Message: Message
      }
    });
  }

  saveAttributeValues(mode: string = 'add') {
    const body = { 
      mode: mode,
      data: this.attributeValueMasterObj 
    };
    return this.http.post(`${this.apiUrl}/saveAttributeValues`, body);
  }

  clearAttributeValues() {
    this.attributeValueMasterObj = {
      AttributeType: '',
      ApplyTo: '',
      AttributeValues: [],
    };
  }

}