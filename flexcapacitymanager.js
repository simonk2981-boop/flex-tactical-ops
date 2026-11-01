class FlexCapacityManager {
    constructor(maxHours = 40, reserveBuffer = 4.5) {
        this.maxHours = maxHours;
        this.reserveBuffer = reserveBuffer;
    }

    calculateRollingSum(pastShifts, scheduledToday) {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0); 

        const pastHours = pastShifts
            .filter(shift => new Date(shift.date) >= sevenDaysAgo)
            .reduce((total, shift) => total + shift.duration, 0);

        return pastHours + scheduledToday;
    }

    getActiveBuffer() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        const isSurgeWindowActive = hour < 5 || (hour === 5 && minute === 0);
        return isSurgeWindowActive ? this.reserveBuffer : 0;
    }

    getDeployableCapacity(pastShifts, scheduledToday) {
        const rollingSum = this.calculateRollingSum(pastShifts, scheduledToday);
        const activeBuffer = this.getActiveBuffer();
        
        const deployable = this.maxHours - (rollingSum + activeBuffer);
        return Math.max(0, deployable); 
    }
}
