/* 

Below is an example organisation chart. At the top is the ceo, Mark Zuckerberg. Mark's subordinates are Sarah, Tyler, Bruce and Georgina. 

Mark Zuckerberg:
    - Sarah Donald:
        - Cassandra Reynolds:
            - Mary Blue:
            - Bob Saget:
                - Tina Teff:
                    - Will Turner:
    - Tyler Simpson:
        - Harry Tobs:
            - Thomas Brown:
        - George Carrey:
        - Gary Styles:
    - Bruce Willis:
    - Georgina Flangy:
        - Sophie Turner:


The CEO is represented with the following structure.


interface Employee {
  uniqueId: number;
  name: string;
  subordinates: Employee[];
}

const ceo: Employee = {
    uniqueId: 1
    name: Mark Zuckerberg,
    subordinates: [Employee, Employee, ....]
}

Your task is to create a concrete class called EmployeeOrgApp that implements IEmployeeOrgApp. The class should be instantiable with the ceo as a constructor parameter. 
E.g. const app = new EmployeeOrgApp(ceo)

The class should:
1. move employee A to become the subordinate of employee B (i.e. B becomes A's supervisor)
2. undo/redo the move action

ASSUMPTIONS:
You may assume: 
- when an employee (e.g. Bob Saget) is moved to a new supervisor (e.g. Georgina), Bob's existing subordinates (Tina Teff) will become the subordinate of Cassandra, Bob's old supervisor.
- employees without any subordinates have an empty list for their subordinates property


ASSESSMENT CRITERIA:
1. The efficiency of the code
2. Object oriented programming design
3. Readability
4. Completeness of solution

REQUIREMENTS:
Must be written in Typescript.

*/
interface Employee {
  uniqueId: number;
  name: string;
  subordinates: Employee[];
}

interface IEmployeeOrgApp {
  ceo: Employee;

  /**
   * Moves the employee with employeeID (uniqueId) under a supervisor (another employee) that has supervisorID (uniqueId).
   * E.g. move Bob (employeeID) to be subordinate of Georgina (supervisorID).
   * @param employeeID
   * @param supervisorID
   */
  move(employeeID: number, supervisorID: number): void;

  /**
   * Undo last move action
   */
  undo(): void;

  /**
   * Redo last undone action
   */
  redo(): void;
}

interface HistoryAction {
  fromIndexPosition: number[],
  toIndexPosition: number[],
  employeeIDs: number[],
  fromSupervisorID: number,
}

interface HistoryItem {
  actions: HistoryAction[],
}


class EmployeeOrgApp implements IEmployeeOrgApp {
  ceo: Employee;
  histories: HistoryItem[] = []; // use to save history of actions
  historyIndex = -1; // this is use for index current state of data in history, use for undo and redo
  indexCache: Record<number, number[]> = {} // use for storage cache by employeeID with position it self

  constructor(ceo: Employee) {
    this.ceo = ceo;
  }

  /**
 * Moves the employee with employeeID (uniqueId) under a supervisor (another employee) that has supervisorID (uniqueId).
 * E.g. move Bob (employeeID) to be subordinate of Georgina (supervisorID).
 * @param employeeID | number
 * @param supervisorID | number
 */
  move(employeeID: number, supervisorID: number) {
    const historyItem: HistoryItem = {
      actions: []
    }
    if (employeeID === this.ceo.uniqueId) {
      //we can not move ceo
      return;
    }
    const indexPostionEmployee = this.getIndexPositionByEmployeeID(employeeID);
    const indexPostionSupervisor = this.getIndexPositionByEmployeeID(supervisorID);
    if (!indexPostionEmployee || !indexPostionSupervisor) {
      alert("employeeID or supervisorID not found")
      return;
    }

    const oldSupervisorIndexPosition = [...indexPostionEmployee]
    oldSupervisorIndexPosition.pop();

    const oldSupervisor = this.getEmployeeByIndexPosition(oldSupervisorIndexPosition)
    const employee = this.getEmployeeByIndexPosition(indexPostionEmployee)

    if (employee.subordinates.length) {
      //move all Subordinates of current employee to old Supervisor
      const employeeIDs: number[] = []
      oldSupervisor.subordinates = oldSupervisor.subordinates.concat(employee.subordinates)
      employee.subordinates.map(e => {
        employeeIDs.push(e.uniqueId);
        //clear cache for moved item
        this.removeIndexPositionByEmployeeIDCache(e.uniqueId)
      })
      historyItem.actions.push({
        fromIndexPosition: indexPostionEmployee,
        fromSupervisorID: employeeID,
        toIndexPosition: oldSupervisorIndexPosition,
        employeeIDs,
      })
    }

    //copy employee to new Supervisor and remove from old position
    const newEmployee = { ...employee };
    newEmployee.subordinates = [];

    this.addEmployeeToSupervisorByIndexPosition(newEmployee, indexPostionSupervisor);
    this.removeEmployeeByIndexPosition(indexPostionEmployee);
    //clear cache for moved item
    this.removeIndexPositionByEmployeeIDCache(employeeID)

    //add to history actions
    historyItem.actions.push({
      fromIndexPosition: oldSupervisorIndexPosition,
      fromSupervisorID: oldSupervisor.uniqueId,
      toIndexPosition: indexPostionSupervisor,
      employeeIDs: [employee.uniqueId]
    })
    //add item to history
    this.addNewHistoryItem(historyItem)
  }

  /**
   * Undo last move action
   */
  undo() {
    if (!this.histories.length) {
      return;
    }
    if (this.historyIndex < 0) {
      return;
    }
    const historyItem = this.histories[this.historyIndex];
    const actions = historyItem.actions
    if (!actions || !actions.length) {
      return
    }
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const fromSupervisorIndexPosition = this.getIndexPositionByEmployeeID(action.fromSupervisorID)
      if (!fromSupervisorIndexPosition) {
        return;
      }
      action.employeeIDs.forEach(employeeID => {
        const indexPostionEmployee = this.getIndexPositionByEmployeeID(employeeID)
        if (!indexPostionEmployee) {
          return
        }
        const employee = this.getEmployeeByIndexPosition(indexPostionEmployee)
        this.addEmployeeToSupervisorByIndexPosition({ ...employee }, fromSupervisorIndexPosition);
        this.removeEmployeeByIndexPosition(indexPostionEmployee);
        //clear cache for moved item
        this.removeIndexPositionByEmployeeIDCache(employeeID)
      })
    }
    this.historyIndex--;
  }

  /**
   * Redo last undone action
   */
  redo() {
    this.historyIndex++;
    if (!this.histories.length) {
      return;
    }
    if (this.historyIndex > this.histories.length - 1) {
      return;
    }
    const historyItem = this.histories[this.historyIndex];
    const actions = historyItem.actions
    if (!actions || !actions.length) {
      return
    }
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const fromSupervisor = this.getEmployeeByIndexPosition(action.fromIndexPosition)
      action.employeeIDs.forEach(employeeID => {
        const lastIndexPostionEmployee = this.getIndexPosition(fromSupervisor, employeeID);
        if (!lastIndexPostionEmployee) {
          return;
        }
        const indexPostionEmployee = action.fromIndexPosition.concat(lastIndexPostionEmployee);
        const employee = this.getEmployeeByIndexPosition(indexPostionEmployee)

        // add employee to new Supervisor and remove from old Supervisor
        this.addEmployeeToSupervisorByIndexPosition({ ...employee }, action.toIndexPosition);
        this.removeEmployeeByIndexPosition(indexPostionEmployee);
        //clear cache for moved item
        this.removeIndexPositionByEmployeeIDCache(employeeID)
      })
    }
  }

  /**
   * @description add new history to cached histories list
   * @param historyItem 
   */
  private addNewHistoryItem(historyItem: HistoryItem) {
    if (this.historyIndex < this.histories.length && this.histories.length) {
      const fromIndex = this.historyIndex + 1
      const numberItemNeedRemove = this.histories.length - fromIndex
      this.histories.splice(fromIndex, numberItemNeedRemove)
    }
    this.histories.push(historyItem)
    this.historyIndex = this.histories.length - 1;
  }

  /**
   * @description get emplyee data by index position
   * E.g return `ceo > subordinates[0] > subordinates[3] > subordinates[4]` when `indexPosition` = [0, 3, 4]`
   * @param indexPosition 
   */
  private getEmployeeByIndexPosition(indexPosition: number[]) {
    let employee = this.ceo;
    indexPosition.forEach(index => {
      employee = employee.subordinates[index]
    })
    return employee
  }

  /**
   * @description add an employee to a supervisor with gave position of supervisor
   * @param employee | Employee
   * @param supervisorIndexPosition | number[]
   */
  private addEmployeeToSupervisorByIndexPosition(employee: Employee, supervisorIndexPosition: number[]) {
    let supervisor = this.ceo;
    supervisorIndexPosition.forEach(index => {
      supervisor = supervisor.subordinates[index]
    })
    supervisor.subordinates.push(employee)
  }

  /**
   * @description use to remove an employee with gave position
   * @param indexPosition 
   */
  private removeEmployeeByIndexPosition(indexPosition: number[]) {
    let supervisor = this.ceo;
    for (let i = 0; i < indexPosition.length - 1; i++) {
      const index = indexPosition[i];
      supervisor = supervisor.subordinates[index]
    }
    supervisor.subordinates.splice(indexPosition[indexPosition.length - 1], 1)
  }

  /**
   * @description use to set cache position of employee with employeeId and data
   * @param employeeId | number
   * @param data | number[]
   */
  private setIndexPositionByEmployeeIDCache(employeeId: number, data: number[]): void {
    this.indexCache[employeeId] = data;
  }

  /**
   * @description use to get cached position of employee with employeeId
   * @param employeeId | number
   */
  private getIndexPositionByEmployeeIDCache(employeeId: number): number[] | null {
    return this.indexCache[employeeId] || null
  }

  /**
   * @description use to remove cached position of employee with employeeId
   * @param employeeId | number
   */
  private removeIndexPositionByEmployeeIDCache(employeeId: number) {
    delete this.indexCache[employeeId]
  }

  /**
   * @description use to find position of employee with employeeId inside `this.ceo` data, it will use cache to return the data cached.
   * it will return an array of number or null, null mean this employeeId can not found
   * E.g return [0, 3, 4] that mean this item with uniqueId equal employeeId have position ceo > subordinates[0] > subordinates[3] > subordinates[4]
   * @param employeeId | number
   */
  private getIndexPositionByEmployeeID(employeeId: number): number[] | null {
    let indexPosition = this.getIndexPositionByEmployeeIDCache(employeeId);
    if (!indexPosition) {
      indexPosition = this.getIndexPosition(this.ceo, employeeId)
      if (indexPosition) {
        this.setIndexPositionByEmployeeIDCache(employeeId, indexPosition)
      }
    }
    return indexPosition;
  }

  /**
   * @description use to find position of employee with employeeId inside data(first param), it will return an array of number or null, null mean this employeeId can not found
   * E.g return [0, 3, 4] that mean this item with uniqueId equal employeeId have position ceo > subordinates[0] > subordinates[3] > subordinates[4]
   * @param data | Employee
   * @param employeeId | number
   * @param indexPosition | number[]
   */
  private getIndexPosition(data: Employee, employeeId: number, indexPosition: number[] = []): number[] | null {
    this.setIndexPositionByEmployeeIDCache(data.uniqueId, indexPosition)
    if (data.uniqueId === employeeId) {
      return indexPosition
    }
    if (!data.subordinates.length) {
      return null
    }
    for (let i = 0; i < data.subordinates.length; i++) {
      const tmpIndexPosition = [...indexPosition];
      tmpIndexPosition.push(i);
      const newIndexPostion = this.getIndexPosition(data.subordinates[i], employeeId, tmpIndexPosition);
      if (newIndexPostion) {
        return newIndexPostion
      }
    }
    return null
  }
}
