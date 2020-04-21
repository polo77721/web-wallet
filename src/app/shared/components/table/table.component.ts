import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { DataSource } from '@angular/cdk/collections';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatTable } from '@angular/material';

import { Observable, BehaviorSubject, of } from 'rxjs';
// import 'rxjs/add/operator/startWith';
// import 'rxjs/add/observable/merge';
// import 'rxjs/add/operator/map';

import { environment } from '@environment';
import {Router} from '@angular/router';

import { Store, select } from '@ngrx/store';
import { selectContact } from '../../../store/selectors/wallet-state.selectors';
import { selectUtxoById } from '../../../store/selectors/utxo.selectors';
import { TableTypes } from '@consts';

import { WebsocketService } from './../../../services';
import { Subscription } from 'rxjs';

import {
  saveProofData
} from './../../../store/actions/wallet.actions';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TableComponent implements OnInit, OnChanges {
  @Input() tableData: any;
  @Input() tableColumns: any;
  @Input() tableType: any;
  activeSortItem = null;
  isReversedSort = false;
  contact$: Observable<any>;
  utxoList$: Observable<any>;

  isUtxoListVisible = true;
  tableTypes = TableTypes;
  sub: Subscription;
  proofValue = '';

  //exampleDatabase = new ExampleDatabase();
  //@ViewChild(MatTable, {static: true}) table: MatTable<any>;

  sortParams = {
    created: 'create_time',
    from: 'sender',
    to: 'receiver',
    amount: 'value',
    status: 'status_string',
    address: 'address',
    name: 'comment',
    exp_date: 'create_time',
    contactName: 'name',
    maturity: 'maturity',
    utxo_amount: 'amount',
    utxo_type: 'type'
  };

  public iconSort: string = `${environment.assetsPath}/images/shared/components/table/icon-sort.svg`;
  public iconSortActive: string = `${environment.assetsPath}/images/shared/components/table/icon-sort-active.svg`;
  public contactIcon: string = `${environment.assetsPath}/images/shared/components/table/icon-contact.svg`;
  public arrowIcon: string = `${environment.assetsPath}/images/shared/components/table/icon-arrow.svg`;
  public sentIcon: string = `${environment.assetsPath}/images/shared/components/table/icon-sent.svg`;
  public receivedIcon: string = `${environment.assetsPath}/images/shared/components/table/icon-received.svg`;

  dataSource: any;

  isExpansionDetailRow = (i: number, row: Object) => row.hasOwnProperty('detailRow');
  expandedElement: any = null;

  constructor(
    private store: Store<any>,
    private router: Router,
    private websocketService: WebsocketService,
    private changeDetectorRefs: ChangeDetectorRef) {

  }

  getExpandedState(data) {
    let expState = 'collapsed';
    if ((this.tableType === TableTypes.TRANSACTIONS && data.txId === this.expandedElement.txId) ||
        (this.tableType === TableTypes.UTXO && data.id === this.expandedElement.id) ||
        (this.tableType === TableTypes.ADDRESSES && data.address === this.expandedElement.address)) {
      expState = 'expanded';
    }

    return expState;
  }

  ngOnInit() {
    //this.dataSource = new ExampleDataSource(this.exampleDatabase);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.tableData) {
      if (this.expandedElement === null && this.tableType === TableTypes.TRANSACTIONS) {
        this.expandedElement = {txId: null};
      } else if (this.expandedElement === null && this.tableType === TableTypes.UTXO) {
        this.expandedElement = {id: null};
      } else if (this.expandedElement === null && this.tableType === TableTypes.ADDRESSES) {
        this.expandedElement = {address: null};
      }

      let updatedData = changes.tableData.currentValue;
      if (this.activeSortItem !== null) {
        this.isReversedSort = !this.isReversedSort;
        updatedData = this.getSortedDataSource(this.activeSortItem, updatedData);
      }

      this.dataSource = new ExampleDataSource(updatedData);


      // if (this.exampleDatabase.data.length > 0) {
      //   changes.tableData.currentValue.forEach(element => this.exampleDatabase.updateItem(element));
      // } else {
      //   changes.tableData.currentValue.forEach(element => this.exampleDatabase.addItem(element));
      // }
    }
  }

  expandElement(row) {
    if (this.expandedElement.txId !== null && this.expandedElement === row) {
      if (this.tableType === TableTypes.TRANSACTIONS) {
        this.expandedElement = {txId: null};
      } else if (this.tableType === TableTypes.UTXO) {
        this.expandedElement = {id: null};
      } else if (this.tableType === TableTypes.ADDRESSES) {
        this.expandedElement = {address: null};
      }
    } else {
      this.expandedElement = row;
      if (this.tableType === TableTypes.TRANSACTIONS) {
        this.contact$ = row.income ? this.store.pipe(select(selectContact(row.sender))) :
          this.store.pipe(select(selectContact(row.receiver)));
        if (row.status_string === 'sent') {
          this.utxoList$ = this.store.pipe(select(selectUtxoById(row.txId)));
          this.loadPaymentProof(row);
        }
      }
    }
    this.isUtxoListVisible = true;
  }

  getItemSrc(item) {
    // return item.path === this.router.url ? item.srcOn : (item.src || item.srcOut);
  }

  utxoListHeaderClicked($event) {
    $event.stopPropagation();
    this.isUtxoListVisible = !this.isUtxoListVisible;
  }

  getSortedDataSource(sortBy, value) {
    const sortedData = value.sort((a, b) => {
      if (a[sortBy] > b[sortBy]) {
        return 1; }
      if (a[sortBy] < b[sortBy]) {
        return -1; }
      return 0;
    });

    if (this.isReversedSort) {
      sortedData.reverse();
      this.isReversedSort = false;
    } else {
      this.isReversedSort = true;
    }

    return sortedData;
  }

  sortClicked(sortBy) {
    this.isReversedSort = this.activeSortItem === sortBy && this.isReversedSort;
    this.activeSortItem = sortBy;
    const sortedSource = this.getSortedDataSource(sortBy, this.dataSource.DataArray);

    this.dataSource = new ExampleDataSource(sortedSource);
  }

  proofDetailsClicked($event) {
    $event.stopPropagation();
    this.router.navigate([this.router.url, { outlets: { popup: 'payment-proof-exported' }}]);
  }

  private loadPaymentProof(transaction) {
    this.sub = this.websocketService.on().subscribe((msg: any) => {
      if (msg.id === 4) {
        if (msg.result && msg.result.payment_proof) {
          this.proofValue = msg.result.payment_proof;
          this.store.dispatch(saveProofData({proofData: {
            sender: transaction.sender,
            receiver: transaction.receiver,
            amount: transaction.value,
            kernelId: transaction.kernel,
            code: msg.result.payment_proof
          }}));
        }
        this.sub.unsubscribe();
      }
    });

    this.websocketService.send({
      jsonrpc: '2.0',
      id: 4,
      method: 'export_payment_proof',
      params: {
        txId: transaction.txId
      }
    });
  }

  proofDataToCp() {
    return this.proofValue;
  }
}

export class ExampleDataSource extends DataSource<any> {
  constructor(private DataArray: any[]) {
    super();
  }

  connect(): Observable<any[]> {
    const rows = [];
    this.DataArray.forEach(element => rows.push(element, { detailRow: true, element }));
    return of(rows);
  }
  disconnect() {}
}


// export class ExampleDatabase {
//   /** Stream that emits whenever the data has been modified. */
//   dataChange: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
//   get data(): any[] { return this.dataChange.value; }

//   constructor() {
//   }

//   addItem(data) {
//     const copiedData = this.data.slice();
//     copiedData.push(data, { detailRow: true, element: data });
//     this.dataChange.next(copiedData);
//   }

//   updateItem(data) {
//     const updatedArray = this.dataChange.value.map(item => {
//       if (item.txId === data.txId) {
//         return data;
//       } else if (item.element !== undefined && item.element.txId === data.txId) {
//         return { detailRow: true, element: data };
//       } else {
//         return item;
//       }
//     });

//     this.dataChange.next(updatedArray);
//   }

//   sortItems() {
//     console.log(1);
//   }
// }

// export class ExampleDataSource extends DataSource<any> {
//   constructor(private _exampleDatabase: ExampleDatabase) {
//     super();
//   }

//   // connect(): Observable<any[]> {
//   //   const rows = [];
//   //   this.DataArray.forEach(element => rows.push(element, { detailRow: true, element }));
//   //   return of(rows);
//   // }

//   connect(): Observable<any[]> {
//     return this._exampleDatabase.dataChange;
//   }

//   disconnect() {}
// }
