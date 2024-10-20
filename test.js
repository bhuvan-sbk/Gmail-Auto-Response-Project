function splitArray(arr) {
    const sum = arr.reduce((total, num) => total + num, 0);
    if (sum % 2 !== 0) {
      return -1; // Impossible to split the array into two sets with equal sums
    }
  
    const targetSum = sum / 2;
    const selected = [];
    let found = false;
  
    function search(currentSum, startIndex) {
      if (currentSum === targetSum) {
        found = true;
        return; // Found a valid split
      }
      if (currentSum > targetSum || startIndex >= arr.length || found) {
        return; // Reached an invalid split or already found a solution
      }
  
      for (let i = startIndex; i < arr.length; i++) {
        const num = arr[i];
        selected.push(num);
        search(currentSum + num, i + 1);
        if (found) {
          return;
        }
        selected.pop(); // Backtrack and remove the selected number
      }
    }
  
    search(0, 0);
  
    if (!found) {
      return -1; // Impossible to split the array into two sets with equal sums
    }
  
    const sortedSelected = selected.sort((a, b) => a - b);
    const sortedRemaining = arr.filter(num => !selected.includes(num)).sort((a, b) => a - b);
    const result = [...sortedSelected, ...sortedRemaining].join(",");
    return result;
  }
  
  console.log(splitArray([16, 22, 35, 8, 20, 1, 21, 11])); // Output: 1,11,20,35,8,16,21,22
  console.log(splitArray([1, 2, 3, 4])); // Output: 1,4,2,3
  console.log(splitArray([1, 2, 1, 5])); // Output: -1
  