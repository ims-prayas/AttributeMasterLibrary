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

  syncTable() {
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
    this.tableDataSubject.next([]);
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
  return this.getAttributeDetails(attributeType, applyTo).subscribe({
    next: (res) => {
    if (res.status === 'ok') {
      this.attributeMasterObj = {
        AttributeType: attributeType,
        ApplyTo: applyTo,
        IsMappingRequired: res.result.IsMappingRequired,
        MappedBy: res.result.MappedBy,
        AttributeDetails: res.result.AttributeDetails || [],
      };
        this.syncTable();
      }else{
        this.openErrorDialog('Failed to load table data');
      }
    },
    error: ()=> this.openErrorDialog('Failed to load attribute details')
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


  clearTable() {
    // this.attributeMasterObj.AttributeDetails = [];
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